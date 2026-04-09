import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import Problem from "../models/ProblemModel.js";

const seed = async () => {
  await connectDB();

  const count = await Problem.countDocuments();
  if (count > 0) {
    console.log(`Problems already exist (${count}). Skipping seed.`);
    process.exit(0);
  }

  await Problem.insertMany([
    {
      title: "Sum of Two Numbers",
      slug: "sum-of-two-numbers",
      difficulty: "Easy",
      description:
        "Given two integers a and b, print their sum.\n\nInput format:\n- Two integers a and b separated by space\n\nOutput format:\n- Print a + b",
      constraints: ["-10^9 ≤ a, b ≤ 10^9"],
      tags: ["math", "basics"],
      hints: ["Read two integers, print sum."],
      supportedLanguages: ["javascript", "python", "java", "cpp"],
      starterCode: {
        javascript: `// Read stdin, write stdout\n// Input: two integers a and b\n// Output: a+b\n\nprocess.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet input='';\nprocess.stdin.on('data', chunk => input += chunk);\nprocess.stdin.on('end', () => {\n  const [a,b] = input.trim().split(/\\s+/).map(Number);\n  console.log((a + b).toString());\n});\n`,
        python: `# Read stdin, write stdout\nimport sys\n\ndef main():\n    data = sys.stdin.read().strip().split()\n    a, b = map(int, data[:2])\n    print(a + b)\n\nif __name__ == "__main__":\n    main()\n`,
        java: `import java.io.*;\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n    StringTokenizer st = new StringTokenizer(br.readLine());\n    long a = Long.parseLong(st.nextToken());\n    long b = Long.parseLong(st.nextToken());\n    System.out.print(a + b);\n  }\n}\n`,
        cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  long long a, b;\n  if(!(cin >> a >> b)) return 0;\n  cout << (a + b);\n  return 0;\n}\n`,
      },
      visibleTestCases: [
        { input: "2 3\n", expectedOutput: "5\n" },
        { input: "-10 7\n", expectedOutput: "-3\n" },
      ],
      hiddenTestCases: [
        { input: "1000000000 1000000000\n", expectedOutput: "2000000000\n" },
        { input: "-1000000000 1\n", expectedOutput: "-999999999\n" },
      ],
    },
    {
      title: "Reverse a String",
      slug: "reverse-a-string",
      difficulty: "Easy",
      description:
        "Given a string s, print the reverse of s.\n\nInput:\n- A single line string\n\nOutput:\n- Reversed string",
      constraints: ["1 ≤ |s| ≤ 10^5"],
      tags: ["string"],
      hints: ["In JS: split + reverse + join.", "In C++: reverse()."],
      supportedLanguages: ["javascript", "python", "java", "cpp"],
      starterCode: {
        javascript: `process.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet input='';\nprocess.stdin.on('data', c => input += c);\nprocess.stdin.on('end', () => {\n  const s = input.replace(/\\r\\n/g,'\\n').trimEnd();\n  console.log(s.split('').reverse().join(''));\n});\n`,
        python: `import sys\n\ndef main():\n    s = sys.stdin.read().rstrip('\\n')\n    print(s[::-1])\n\nif __name__ == '__main__':\n    main()\n`,
        java: `import java.io.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n    String s = br.readLine();\n    StringBuilder sb = new StringBuilder(s);\n    System.out.print(sb.reverse().toString());\n  }\n}\n`,
        cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  string s;\n  getline(cin, s);\n  reverse(s.begin(), s.end());\n  cout << s;\n  return 0;\n}\n`,
      },
      visibleTestCases: [
        { input: "abcd\n", expectedOutput: "dcba\n" },
        { input: "hello world\n", expectedOutput: "dlrow olleh\n" },
      ],
      hiddenTestCases: [{ input: "a\n", expectedOutput: "a\n" }],
    },
  ]);

  console.log("Seeded problems successfully.");
  process.exit(0);
};

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});

