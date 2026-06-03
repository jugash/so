#!/usr/bin/env python3
import threading
import time
import urllib.request
import urllib.error
import json
import statistics

# Configuration
TARGET_URLS = [
    "http://localhost:8080/api/questions?sort=newest&page=0&size=10",
    "http://localhost:8080/api/questions?sort=newest&page=1&size=10",
    "http://localhost:8080/api/questions?sort=votes&page=0&size=10",
    "http://localhost:8080/api/questions?sort=votes&page=1&size=10",
    "http://localhost:8080/api/users/3/questions?page=0&size=10",
    "http://localhost:8080/api/users/3/questions?page=1&size=10",
    "http://localhost:8080/api/search?q=spring&page=0&size=10",
    "http://localhost:8080/api/search?q=spring&page=1&size=10",
    "http://localhost:8080/api/tags"
]
CONCURRENT_USERS = 8
TEST_DURATION_SECONDS = 10

# Stats collection
latencies = []
status_codes = {}
results_lock = threading.Lock()

stop_threads = False

def run_user_simulation():
    global stop_threads
    while not stop_threads:
        # Pick an endpoint in round-robin or sequence
        for url in TARGET_URLS:
            if stop_threads:
                break
                
            start_time = time.perf_counter()
            status = 200
            
            try:
                # Set timeout of 5 seconds
                with urllib.request.urlopen(url, timeout=5) as response:
                    # Read response body to simulate real client consumption
                    response.read()
                    status = response.status
            except urllib.error.HTTPError as e:
                status = e.code
            except Exception as e:
                status = 0 # Network/Timeout error
                
            end_time = time.perf_counter()
            duration_ms = (end_time - start_time) * 1000
            
            with results_lock:
                latencies.append(duration_ms)
                status_codes[status] = status_codes.get(status, 0) + 1
                
            # Subtle sleep to prevent CPU throttling (simulated think time)
            time.sleep(0.01)

def run_performance_test():
    global stop_threads
    print(f"====================================================")
    print(f"      MetalStack Backend Performance Load Test      ")
    print(f"====================================================")
    print(f"Target endpoints:")
    for url in TARGET_URLS:
        print(f"  - {url}")
    print(f"Concurrent Users (Threads): {CONCURRENT_USERS}")
    print(f"Test Duration: {TEST_DURATION_SECONDS} seconds")
    print(f"Running... please wait...")
    
    threads = []
    start_test_time = time.time()
    
    # Spawn simulated user threads
    for i in range(CONCURRENT_USERS):
        t = threading.Thread(target=run_user_simulation)
        threads.append(t)
        t.start()
        
    # Wait for test duration
    time.sleep(TEST_DURATION_SECONDS)
    
    # Stop simulation loop
    stop_threads = True
    for t in threads:
        t.join()
        
    actual_duration = time.time() - start_test_time
    
    # Calculate statistics
    with results_lock:
        total_requests = len(latencies)
        all_latencies = sorted(latencies)
        all_status_codes = dict(status_codes)
        
    if total_requests == 0:
        print("Error: No requests were recorded. Is the backend running on port 8080?")
        return
        
    rps = total_requests / actual_duration
    success_requests = all_status_codes.get(200, 0)
    success_rate = (success_requests / total_requests) * 100
    
    avg_latency = sum(all_latencies) / total_requests
    p50_latency = statistics.median(all_latencies)
    p95_index = int(total_requests * 0.95)
    p95_latency = all_latencies[min(p95_index, total_requests - 1)]
    p99_index = int(total_requests * 0.99)
    p99_latency = all_latencies[min(p99_index, total_requests - 1)]
    min_latency = all_latencies[0]
    max_latency = all_latencies[-1]
    
    print(f"\n==================== RESULTS ========================")
    print(f"Actual Test Duration : {actual_duration:.2f} seconds")
    print(f"Total Requests Made  : {total_requests}")
    print(f"Throughput (RPS)     : {rps:.2f} req/sec")
    print(f"Success Rate (200 OK): {success_rate:.2f}%")
    print(f"\nLatency Statistics:")
    print(f"  Min Response Time  : {min_latency:.2f} ms")
    print(f"  Avg Response Time  : {avg_latency:.2f} ms")
    print(f"  P50 (Median) Latency: {p50_latency:.2f} ms")
    print(f"  P95 Latency         : {p95_latency:.2f} ms")
    print(f"  P99 Latency         : {p99_latency:.2f} ms")
    print(f"  Max Response Time  : {max_latency:.2f} ms")
    print(f"\nHTTP Response Status Codes:")
    for status, count in sorted(all_status_codes.items()):
        status_name = "OK" if status == 200 else "Error/Other"
        print(f"  HTTP {status} ({status_name}): {count} requests ({ (count/total_requests)*100 :.1f}%)")
    print(f"====================================================")

if __name__ == "__main__":
    run_performance_test()
