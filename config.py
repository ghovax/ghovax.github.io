import logging
import os
from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv('DEBUG') == '1'

site = 'https://ghovax.github.io'

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format='%(asctime)s %(levelname)s [%(filename)s:%(lineno)d %(funcName)s] - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

output_dir = os.path.join(os.path.dirname(__file__), 'output/')
