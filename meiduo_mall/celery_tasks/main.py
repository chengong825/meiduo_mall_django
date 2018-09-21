from celery import Celery
# 为celery使用django配置文件进行设置
import os
if not os.getenv('DJANGO_SETTINGS_MODULE'):
    os.environ['DJANGO_SETTINGS_MODULE'] = 'meiduo_mall.settings.dev'

# 创建celery应用
# app = Celery('meiduo')
app = Celery('meiduo',broker="redis://127.0.0.1:6379/15",backend="redis://localhost:6379/10")
# 导入celery配置
# app.config_from_object('celery_tasks.config')

# 自动注册celery任务
app.autodiscover_tasks(['celery_tasks.sms','celery_tasks.email','celery_tasks.html'])