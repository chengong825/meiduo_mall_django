import random

from django.http import HttpResponse
from django.shortcuts import render
from django_redis import get_redis_connection

# from meiduo_mall.meiduo_mall.libs.captcha.captcha import captcha
# Create your views here.
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from celery_tasks.sms.tasks import send_sms_code
from meiduo_mall.libs.captcha.captcha import captcha
from meiduo_mall.utils.yuntongxun.sms import CCP
from verifications import serializers
from . import constants

class ImageCodeView(APIView):
    def get(self,request,image_code_id):
        image_code_id=image_code_id
        text,image=captcha.generate_captcha()
        print(type(image_code_id),type(text))
        redis_conn=get_redis_connection('verify_codes')
        redis_conn.setex("img_%s"%image_code_id,constants.IMAGE_CODE_REDIS_EXPIRES,text)
        return HttpResponse(image,content_type="image/jpg")


class SMSCodeView(GenericAPIView):
    """
        短信验证码
        传入参数：
            mobile, image_code_id, text
    """
    serializer_class = serializers.ImageCodeCheckSerializer
    def get(self,request,mobile):
        # print(request.query_params)
        serializer=self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        sms_code="%06d"%random.randint(0,999999)
        print(sms_code)
        redis_conn=get_redis_connection("verify_codes")
        pl=redis_conn.pipeline()
        pl.setex("sms_%s" % mobile, constants.SMS_CODE_REDIS_EXPIRES, sms_code)
        pl.setex("send_flag_%s" % mobile, constants.SEND_SMS_CODE_INTERVAL, 1)
        pl.execute()
        # 发送短信验证码
        sms_code_expires = str(constants.SMS_CODE_REDIS_EXPIRES // 60)
        # ccp = CCP()
        # ccp.send_template_sms(mobile, [sms_code, sms_code_expires], constants.SMS_CODE_TEMP_ID)
        send_sms_code.delay(mobile,sms_code,sms_code_expires)
        return Response({"message": "OK","sms":sms_code})