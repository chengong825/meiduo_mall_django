# -*- coding: utf-8 -*-
# Generated by Django 1.11.11 on 2018-08-25 11:05
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('goods', '0003_auto_20180825_1026'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='goods',
            name='parent',
        ),
    ]