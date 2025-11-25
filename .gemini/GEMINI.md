# Agent Coding Protocol: TDD, Incremental Development, and Quality Gates

This protocol establishes the mandatory rules and best practices for all coding agents. All development must follow Test-Driven Development (TDD) principles, structured around Incremental Development, and enforced by a rigorous Testing Pyramid and Quality Gates.

## 1. Task Decomposition (The Incremental Plan)
All large user requests must be broken down and planned before any code is written.

### 1.1. Identify the Goal: Define the single, high-level feature, requirement, or bug to be addressed.
### 1.2. Decompose into Smallest Units: Break the goal into the smallest possible units of verifiable functionality (a single function, method, or distinct behavior).
### 1.3. Create an Incremental Plan: Sequence the units logically. This list is the development roadmap.

## 2. The Test-Driven Development (TDD) Cycle
The core of development must follow the Red-Green-Refactor cycle for each small unit in the incremental plan.

| Step | Color | Action | Purpose |
| :--- | :--- | :--- | :--- |
| **2.1. Write a Failing Test** | 🔴 Red | Write a Unit Test that explicitly defines the required behavior. The test must fail upon execution because the code does not yet exist or is incorrect. | Defines the requirement and acts as the specification. |
| **2.2. Write Minimal Code** | 🟢 Green | Write just enough production code to make the failing test pass. Focus only on meeting the test's requirement. | Achieves functional success and proves the requirement is met. |
| **2.3. Refactor and Clean** | 🔁 Refactor | With the test passing, improve the design, readability, and performance of both the production code and the test code. Rerun all tests after every change. | Maintains code quality and integrity using the tests as a safety net. |
| **2.4. Repeat** | | Loop back to Step 2.1 for the next item in the incremental plan. | |
| **2.5. Bug Fix Protocol (TDD Mandatory)** | | When fixing a bug, the first action must be to write a new, failing test that reproduces the bug (🔴 Red). Only then write the fix (🟢 Green), and finally, refactor (🔁 Refactor). | |

## 3. Testing Strategy and Isolation
The test suite must be structured as a pyramid to balance speed and coverage, and tests must be isolated.

### 3.1. The Test Pyramid Structure
| Pyramid Layer | Type of Test | Purpose & Focus | Quantity & Speed |
| :--- | :--- | :--- | :--- |
| **Base** | Unit Tests | Test single classes/functions in isolation. Use mocks/stubs for external dependencies. | Highest Quantity. Must be Fast and Reliable. |
| **Middle** | Integration Tests | Test interactions between several units or external resources (e.g., database connectivity). | Medium Quantity. Slower than Unit Tests. |
| **Top** | End-to-End (E2E) Tests | Simulate the entire user workflow (critical paths only). | Lowest Quantity. Slowest and most brittle. |

### 3.2. Test Structure and Isolation Rules
### 3.2.1. Keep Tests Independent: Each test must be runnable in isolation and its success or failure must not depend on the order or outcome of any other test.
### 3.2.2. Test Behavior, Not Implementation: Tests must assert the expected outcome or behavior of the unit, not the internal steps it took to achieve the result.
### 3.2.3. Use Mocks Wisely: When testing a unit, replace external dependencies (APIs, databases, file system, time) with Test Doubles (Mocks or Stubs) to ensure the test only verifies the unit's logic. Do not over-mock internal helpers.
### 3.2.4. Test Readability (AAA Pattern): All unit tests must follow the Arrange-Act-Assert (AAA) pattern for clarity:
Arrange: Set up necessary preconditions and dependencies.
Act: Execute the code under test.
Assert: Verify the expected outcome.
### 3.2.5. Descriptive Test Naming: Test names must clearly and explicitly describe the specific behavior being tested (e.g., test_should_reject_input_if_empty).

## 4. Quality Gates and Continuous Enforcement
The overall system must enforce these rules through automation and human oversight.

### 4.1. CI Gate Requirement: Every commit to the main branch must first trigger a Continuous Integration (CI) pipeline that automatically runs the full test suite. The merge must be blocked if any test fails (regression check).
### 4.2. Code Coverage Check: All new or modified modules must maintain a minimum of 80% test coverage. This metric must be automatically checked by the CI pipeline, but the agent must understand that coverage is a metric, not a goal (i.e., do not write trivial tests just to hit the number).
### 4.3. Peer Review Mandatory: Before any unit of work is merged, it must undergo automated checks and a peer review. The reviewer must verify that the TDD cycle was followed and that the Refactor step was completed.

## 5. Version Control and Finalization
After successfully completing the Red-Green-Refactor cycle for a unit of work, the changes must be recorded and prepared for review.

### 5.1. Commit on Success: Once a unit of work (code and corresponding tests) has passed the full test suite, the agent must commit the changes to a dedicated feature branch. This creates a precise historical record of a working, tested state.
### 5.2. Descriptive Commit Message: The commit message must be clear and descriptive, explaining what functionality was added or what bug was fixed, and reference any relevant task/ticket IDs.
### 5.3. Push and Create Pull Request: After committing, the agent must push the feature branch to the remote repository and open a Pull Request (PR) to initiate the Quality Gate process (CI and Review).

## 6. Additional Resources and Further Reading
For agents seeking a deeper understanding of these concepts, research the following topics for detailed context and application guides:
Test-Driven Development (TDD): The original TDD book by Kent Beck; TDD vs. BDD comparison.
The Testing Pyramid: Martin Fowler's comprehensive guide on the testing pyramid structure.
Arrange-Act-Assert (AAA) Pattern: Deep dive into structuring test code for maximum clarity.
Code Coverage: What is code coverage and why is 80% often the baseline target?
Writing Descriptive Commit Messages: Guidelines for creating clear, conventional commit messages.
Git Workflow: Understanding the differences between GitHub Flow and GitFlow branching strategies.
