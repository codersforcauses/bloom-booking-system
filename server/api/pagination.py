from rest_framework.pagination import PageNumberPagination
import os
from dotenv import load_dotenv

load_dotenv()


# allow custom page_size and max_page_size from .env
class StandardResultsSetPagination(PageNumberPagination):
    page_size = int(os.getenv("DEFAULT_PAGE_SIZE", 10))
    page_size_query_param = 'page_size'
    max_page_size = int(os.getenv("MAX_PAGE_SIZE", 1000))
