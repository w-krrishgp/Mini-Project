export const SUPPORTED_LANGUAGES = [
  {
    id: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    extension: '.cpp',
    tag: 'Competitive & DSA',
    color: '#00599C',
    starterCode: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

// Function prototype or DSA solution
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    Solution sol;
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> result = sol.twoSum(nums, target);
    
    if (!result.empty()) {
        cout << "Indices: " << result[0] << ", " << result[1] << endl;
    }
    return 0;
}
`,
    sampleBugs: [
      {
        name: 'Binary Search (Integer Overflow Bug)',
        code: `#include <iostream>
#include <vector>

using namespace std;

// DSA Problem: Binary Search
// BUG: Integer overflow when low + high exceeds INT_MAX
int binarySearch(const vector<int>& arr, int target) {
    int low = 0;
    int high = arr.size() - 1;

    while (low <= high) {
        // Potential bug on large arrays: low + high can overflow 32-bit signed int
        int mid = (low + high) / 2; 

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main() {
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13};
    int target = 7;
    int index = binarySearch(arr, target);
    cout << "Found target at index: " << index << endl;
    return 0;
}
`
      },
      {
        name: 'Two Sum (Off-by-One / Infinite Loop)',
        code: `#include <iostream>
#include <vector>

using namespace std;

// DSA Problem: Two Sum Brute Force
// BUG: Off-by-one error in inner loop comparison and bad indices
vector<int> twoSumWrong(vector<int>& nums, int target) {
    int n = nums.size();
    for (int i = 0; i <= n; i++) { // BUG: out of bounds access when i == n
        for (int j = i; j < n; j++) { // BUG: i == j compares same element with itself
            if (nums[i] + nums[j] == target) {
                return {i, j};
            }
        }
    }
    return {};
}

int main() {
    vector<int> nums = {3, 2, 4};
    int target = 6;
    vector<int> ans = twoSumWrong(nums, target);
    cout << "Indices: " << ans[0] << ", " << ans[1] << endl;
    return 0;
}
`
      }
    ]
  },
  {
    id: 'python',
    name: 'Python',
    monacoLang: 'python',
    extension: '.py',
    tag: 'Popular & Clean',
    color: '#3776AB',
    starterCode: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        """
        Given an array of integers nums and an integer target,
        return indices of the two numbers such that they add up to target.
        """
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []

if __name__ == "__main__":
    sol = Solution()
    print("Result:", sol.twoSum([2, 7, 11, 15], 9))
`,
    sampleBugs: [
      {
        name: 'List Mutation during Iteration',
        code: `def remove_even_numbers(numbers: list[int]) -> list[int]:
    # BUG: Modifying a list while iterating over it causes skipped elements
    for num in numbers:
        if num % 2 == 0:
            numbers.remove(num)
    return numbers

# Test: [2, 4, 6, 8, 10] leaves [4, 8] instead of []!
data = [2, 4, 6, 8, 10]
print("After removing evens:", remove_even_numbers(data))
`
      },
      {
        name: 'Binary Search Edge Case (Wrong Boundary)',
        code: `def binary_search(arr, target):
    left = 0
    right = len(arr) # BUG: should be len(arr) - 1 or while left < right
    
    while left <= right: # BUG: index error when right == len(arr)
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

nums = [1, 3, 5, 7, 9]
print("Found:", binary_search(nums, 10))
`
      }
    ]
  },
  {
    id: 'java',
    name: 'Java',
    monacoLang: 'java',
    extension: '.java',
    tag: 'Enterprise & DSA',
    color: '#E76F00',
    starterCode: `import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] result = sol.twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println("Result: " + Arrays.toString(result));
    }
}
`,
    sampleBugs: [
      {
        name: 'String Equality Using == Bug',
        code: `public class StringCheck {
    // BUG: Using == instead of .equals() for String comparison
    public static boolean isMatch(String s1, String s2) {
        return s1 == s2; // Fails when strings are created with 'new' or dynamically
    }

    public static void main(String[] args) {
        String a = new String("hello");
        String b = new String("hello");
        System.out.println("Matches: " + isMatch(a, b)); // Prints false!
    }
}
`
      }
    ]
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoLang: 'javascript',
    extension: '.js',
    tag: 'Web & Scripts',
    color: '#F7DF1E',
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}

// Example usage
console.log("Two Sum indices:", twoSum([2, 7, 11, 15], 9));
`,
    sampleBugs: [
      {
        name: 'Async Loop / Scope Closure Bug',
        code: `function fetchAllData(items) {
    // BUG: forEach does not await async operations properly
    const results = [];
    items.forEach(async (item) => {
        const res = await Promise.resolve(item * 2);
        results.push(res);
    });
    // results is returned empty before async callbacks resolve!
    return results;
}

console.log("Results:", fetchAllData([1, 2, 3]));
`
      }
    ]
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    monacoLang: 'typescript',
    extension: '.ts',
    tag: 'Type Safe',
    color: '#3178C6',
    starterCode: `interface TwoSumResult {
    indices: [number, number] | null;
    found: boolean;
}

function twoSum(nums: number[], target: number): TwoSumResult {
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return {
                indices: [map.get(complement)!, i],
                found: true
            };
        }
        map.set(nums[i], i);
    }
    return { indices: null, found: false };
}

console.log(twoSum([2, 7, 11, 15], 9));
`,
    sampleBugs: []
  },
  {
    id: 'c',
    name: 'C',
    monacoLang: 'c',
    extension: '.c',
    tag: 'Systems & Kernels',
    color: '#A8B9CC',
    starterCode: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}

int main() {
    int nums[] = {2, 7, 11, 15};
    int target = 9;
    int returnSize = 0;
    int* res = twoSum(nums, 4, target, &returnSize);
    if (res != NULL) {
        printf("Indices: %d, %d\\n", res[0], res[1]);
        free(res);
    }
    return 0;
}
`,
    sampleBugs: []
  }
];
