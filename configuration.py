import logging
import os
from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv('DEBUG') == '1'

site = 'https://ghovax.github.io'

# Blog identity, rendered into the Header widget.
blog_title = "Hello, I'm Giovanni Gravili"
blog_subtitle = 'SWE & PhD Researcher @ YCU (Tokyo)'
blog_description = (
    "Collection of some off-script write-ups on software and my research progress; "
    "honorable mentions include: high-performance computing, and computational physics. "
    "Feel free to take a peek and connect with me via the contacts on the side."
)

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format='%(asctime)s %(levelname)s [%(filename)s:%(lineno)d %(funcName)s] - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

output_dir = os.path.join(os.path.dirname(__file__), 'output/')
