"""
RAG System Test Script
Demonstrates the complete RAG pipeline functionality.

Prerequisites:
1. Set GOOGLE_API_KEY environment variable
2. Start the FastAPI server: uvicorn app.main:app --reload
3. Run this script: python test_rag.py
"""

import requests
import os
from pathlib import Path


class RAGTester:
    def __init__(self, base_url="http://localhost:8000/api/rag"):
        self.base_url = base_url
        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        if not self.api_key:
            print("⚠️  Warning: GOOGLE_API_KEY not set in environment variables")
            print("Please set it or provide it when prompted")
    
    def print_section(self, title):
        """Print a formatted section header."""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)
    
    def test_init(self):
        """Test: Initialize RAG service"""
        self.print_section("1. Initializing RAG Service")
        
        # Prompt for API key if not set
        api_key = self.api_key
        if not api_key:
            api_key = input("Enter your Google API key: ").strip()
        
        response = requests.post(
            f"{self.base_url}/init",
            json={
                "api_key": api_key,
                "model_name": "gemini-flash-lite-latest"
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_index_url(self):
        """Test: Index a URL"""
        self.print_section("2. Indexing a URL")
        
        url = "https://lilianweng.github.io/posts/2023-06-23-agent/"
        print(f"📄 Indexing URL: {url}")
        
        response = requests.post(
            f"{self.base_url}/index/url",
            json={"url": url}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            print(f"   Documents: {result['data']['documents']}")
            print(f"   Chunks: {result['data']['chunks']}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_index_text(self):
        """Test: Index plain text"""
        self.print_section("3. Indexing Plain Text")
        
        sample_text = """
        Machine Learning Fundamentals
        
        Machine learning is a subset of artificial intelligence that enables systems to learn 
        and improve from experience without being explicitly programmed. There are three main 
        types of machine learning:
        
        1. Supervised Learning: The algorithm learns from labeled training data and makes 
           predictions based on that data. Examples include classification and regression tasks.
        
        2. Unsupervised Learning: The algorithm finds patterns in unlabeled data. Common tasks 
           include clustering and dimensionality reduction.
        
        3. Reinforcement Learning: The algorithm learns by interacting with an environment and 
           receiving rewards or penalties. This is commonly used in game playing and robotics.
        
        Deep learning is a specialized subset of machine learning that uses neural networks 
        with multiple layers to process complex patterns in large amounts of data.
        """
        
        print(f"📝 Indexing text content ({len(sample_text)} characters)")
        
        response = requests.post(
            f"{self.base_url}/index/text",
            json={
                "content": sample_text,
                "metadata": {
                    "title": "Machine Learning Fundamentals",
                    "category": "education",
                    "topic": "AI"
                }
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            print(f"   Documents: {result['data']['documents']}")
            print(f"   Chunks: {result['data']['chunks']}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_stats(self):
        """Test: Get statistics"""
        self.print_section("4. Getting Index Statistics")
        
        response = requests.get(f"{self.base_url}/stats")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Statistics retrieved:")
            print(f"   Total Documents: {result['total_documents']}")
            print(f"   Total Chunks: {result['total_chunks']}")
            print(f"   Is Indexed: {result['is_indexed']}")
            print(f"   Embedding Dimension: {result.get('embedding_dimension', 'N/A')}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_search(self):
        """Test: Similarity search"""
        self.print_section("5. Testing Similarity Search")
        
        query = "What are the types of machine learning?"
        print(f"🔍 Query: {query}")
        
        response = requests.post(
            f"{self.base_url}/search",
            json={
                "query": query,
                "k": 3
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {len(result['results'])} results:")
            
            for i, doc in enumerate(result['results'], 1):
                print(f"\n   Result {i}:")
                print(f"   Source: {doc['metadata'].get('source_type', 'unknown')}")
                content_preview = doc['content'][:200] + "..." if len(doc['content']) > 200 else doc['content']
                print(f"   Content: {content_preview}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def test_query(self):
        """Test: RAG query with answer generation"""
        self.print_section("6. Testing RAG Query")
        
        questions = [
            "What is task decomposition and how is it used in agent systems?",
            "Explain the three types of machine learning.",
            "What is the difference between supervised and unsupervised learning?"
        ]
        
        for i, question in enumerate(questions, 1):
            print(f"\n📝 Question {i}: {question}")
            
            response = requests.post(
                f"{self.base_url}/query",
                json={
                    "question": question,
                    "k": 4,
                    "return_sources": True
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n💡 Answer:")
                print(f"   {result['answer']}\n")
                print(f"   Sources used: {len(result.get('sources', []))}")
            else:
                print(f"   ❌ Failed: {response.text}")
        
        return True
    
    def test_filtered_search(self):
        """Test: Search with metadata filter"""
        self.print_section("7. Testing Filtered Search")
        
        print("🔍 Searching only in 'string' source type...")
        
        response = requests.post(
            f"{self.base_url}/search",
            json={
                "query": "machine learning",
                "k": 5,
                "filter_dict": {"source_type": "string"}
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Found {len(result['results'])} results with filter:")
            
            for i, doc in enumerate(result['results'], 1):
                print(f"\n   Result {i}:")
                print(f"   Source Type: {doc['metadata'].get('source_type')}")
                print(f"   Topic: {doc['metadata'].get('topic', 'N/A')}")
            return True
        else:
            print(f"❌ Failed: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("\n" + "🚀" * 30)
        print("  RAG SYSTEM COMPREHENSIVE TEST")
        print("🚀" * 30)
        
        tests = [
            ("Initialize Service", self.test_init),
            ("Index URL", self.test_index_url),
            ("Index Plain Text", self.test_index_text),
            ("Get Statistics", self.test_stats),
            ("Similarity Search", self.test_search),
            ("RAG Query", self.test_query),
            ("Filtered Search", self.test_filtered_search),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                success = test_func()
                results.append((test_name, success))
            except Exception as e:
                print(f"\n❌ Error in {test_name}: {str(e)}")
                results.append((test_name, False))
        
        # Print summary
        self.print_section("TEST SUMMARY")
        passed = sum(1 for _, success in results if success)
        total = len(results)
        
        for test_name, success in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status}: {test_name}")
        
        print(f"\n   Total: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n   🎉 All tests passed successfully!")
        else:
            print(f"\n   ⚠️  {total - passed} test(s) failed")


def main():
    """Main function"""
    print("RAG System Test Script")
    print("=" * 60)
    print("\nPre-requisites:")
    print("1. ✅ Set GOOGLE_API_KEY environment variable")
    print("2. ✅ Start FastAPI server: uvicorn app.main:app --reload")
    print("3. ✅ Ensure server is running at http://localhost:8000")
    
    input("\nPress Enter to start tests...")
    
    tester = RAGTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
