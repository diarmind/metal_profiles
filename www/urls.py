from django.conf.urls import url

from www.views import IndexView

urlpatterns = [
    url('^$', IndexView.as_view(), name='index')
]
