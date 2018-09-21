from django.test import TestCase

# Create your tests here.
print(list.__dict__)
handle=getattr(list,'append')
handle1=list.append
print(handle==handle1)