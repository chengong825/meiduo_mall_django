from decimal import Decimal
from django.shortcuts import render

# Create your views here.
from django_redis import get_redis_connection
from rest_framework import mixins
from rest_framework.filters import OrderingFilter
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from goods.models import SKU
from meiduo_mall.utils.pagination import StandardResultsSetPagination

from orders.models import OrderInfo, OrderGoods
from orders.serializers import OrderSettlementSerializer, SaveOrderSerializer, ShowOrderSerializer, \
    ShowOrderGoodsSerializer


class OrderSettlementView(APIView):
    """
    订单结算
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        获取
        """
        user = request.user

        # 从购物车中获取用户勾选要结算的商品信息
        redis_conn = get_redis_connection('cart')
        redis_cart = redis_conn.hgetall('cart_%s' % user.id)
        cart_selected = redis_conn.smembers('cart_selected_%s' % user.id)

        cart = {}
        for sku_id in cart_selected:
            cart[int(sku_id)] = int(redis_cart[sku_id])

        # 查询商品信息
        skus = SKU.objects.filter(id__in=cart.keys())
        for sku in skus:
            sku.count = cart[sku.id]

        # 运费
        freight = Decimal('10.00')

        serializer = OrderSettlementSerializer({'freight': freight, 'skus': skus})
        print(serializer.data)
        return Response(serializer.data)

class SaveOrderView(CreateAPIView):
    """
    保存订单
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SaveOrderSerializer
# class ShowOrdersView(APIView):
#     def get(self, request):
#         user = request.user
#         orders_serializer = ShowOrderSerializer(OrderInfo.objects.filter(user_id=user.id),many=True)
#         orders=orders_serializer.data
#         for temp in orders:
#             order_goods_serializer=ShowOrderGoodsSerializer(OrderGoods.objects.filter(order_id=temp['order_id']), many=True)
#             temp['order_detail']=order_goods_serializer.data
#             print(temp)
#             for sku in temp['order_detail']:
#                 sku_id=sku['sku']
#                 sku['sku_name']=SKU.objects.get(id=sku_id).name
#                 sku['sku_img']=SKU.objects.get(id=sku_id).default_image_url
#         return Response(orders)
class ShowOrdersView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        query_set=OrderInfo.objects.filter(user_id=user.id).order_by('-create_time')
        p2 = StandardResultsSetPagination()
        page_order_list = p2.paginate_queryset(queryset=query_set, request=request, view=self)
        orders_serializer = ShowOrderSerializer(page_order_list,many=True)
        orders=orders_serializer.data
        for temp in orders:
            order_goods_serializer=ShowOrderGoodsSerializer(OrderGoods.objects.filter(order_id=temp['order_id']), many=True)
            temp['order_detail']=order_goods_serializer.data

            for sku in temp['order_detail']:
                sku_id=sku['sku']
                sku['sku_name']=SKU.objects.get(id=sku_id).name
                sku['sku_img']=SKU.objects.get(id=sku_id).default_image_url
        print(orders)
        print(len(orders))
        return p2.get_paginated_response(orders)

        # print(p2.page_size_query_description)
        # page_user_list = p2.paginate_queryset(queryset=user_list, request=request, view=self)
        # print('打印的是分页的数据', page_user_list)
        # 序列化对象
        # ser = MySerializes(instance=page_user_list, many=True)  # 可允许多个
        # 生成分页和数据
        # return Response(ser.data) #不含上一页下一页
        # return p2.get_paginated_response(ser.data)
        # return Response(orders)