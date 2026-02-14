"""
Setup file for Ultra-Dex Python SDK
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("VERSION", "r", encoding="utf-8") as fh:
    version = fh.read().strip()

setup(
    name="ultra-dex-sdk",
    version=version,
    author="Ultra-Dex Team",
    author_email="hello@ultra-dex.ai",
    description="Python SDK for Ultra-Dex AI Orchestration Platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ultra-dex/python-sdk",
    packages=find_packages(where="ultra_dex"),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "aiohttp>=3.8.0,<4.0.0",
        "typing-extensions>=3.10.0"
    ],
    extras_require={
        "dev": [
            "pytest>=6.0",
            "pytest-asyncio>=0.15.0",
            "black>=21.0.0",
            "flake8>=3.8.0",
        ],
    },
    keywords=["ultra-dex", "ai", "orchestration", "sdk", "api"],
    project_urls={
        "Documentation": "https://docs.ultra-dex.ai",
        "Source": "https://github.com/ultra-dex/python-sdk",
        "Tracker": "https://github.com/ultra-dex/python-sdk/issues",
    },
)