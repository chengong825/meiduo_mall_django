from django.shortcuts import render

# Create your views here.
from drf_haystack.viewsets import HaystackViewSet
from rest_framework import status
from rest_framework.filters import OrderingFilter
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from goods.models import SKU, GoodsCategory
from goods.serializers import SKUSerializer, SKUIndexSerializer
from goods.utils import get_categories


class SKUListView(ListAPIView):
    """
    sku列表数据
    """
    # pagination_class = None
    serializer_class = SKUSerializer
    filter_backends = (OrderingFilter,)
    ordering_fields = ('create_time', 'price', 'sales')

    def get_queryset(self):
        category_id = self.kwargs['category_id']
        # print(SKU.objects.filter(category_id=category_id, is_launched=True))
        return SKU.objects.filter(category_id=category_id, is_launched=True)


class HotSKUListView(ListAPIView):
    """
    sku列表数据
    """
    pagination_class = None
    serializer_class = SKUSerializer


    def get_queryset(self):
        category_id = self.kwargs['category_id']
        print(SKU.objects.filter(category_id=category_id, is_launched=True).order_by('-sales')[:5])
        return SKU.objects.filter(category_id=category_id, is_launched=True).order_by('-sales')[:5]


class CategoriesView(APIView):
    def get(self,request,category_id):
        cat3=GoodsCategory.objects.get(id=category_id)
        cat2=cat3.parent
        cat1=cat2.parent
        data={'cat1':{'url':'','category':{'name':cat1.name,'id':cat1.id}},'cat2':{'name':cat2.name},'cat3':{'name':cat3.name},}
        return Response(data=data,status=status.HTTP_200_OK)

class SKUSearchViewSet(HaystackViewSet):
    """
    SKU搜索
    """
    index_models = [SKU]

    serializer_class = SKUIndexSerializer