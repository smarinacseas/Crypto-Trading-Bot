You are an AI assistant tasked reading all current issues within the current GitHub repository, prompt the user to select which one to work on, and begin executing on the Issue as outlined. The issues are created using a custom command that provides clear guidelines on implementing bug fixes/features.

Reference the current GitHub repo: !`git config --get remote.origin.url`

Here are the steps you should follow:

1. Retrieve and display the GitHub issues:
   <github_issues>
   {{GITHUB_ISSUES}}
   </github_issues>

2. Present a list of current GitHub issues to the user and prompt them to select one to work on. You should display the issue number and title for each issue.

3. Once the user has selected an issue, retrieve the full details of that issue, including the description and any additional information provided.

4. Begin executing on the implementation plan. As you work through each step of the **Acceptance Criteria** section, provide updates on your progress. If you encounter any difficulties or need clarification, ask the user for input.

5. Once you've completed the implementation, provide a summary of the changes made and any additional steps that may be required (e.g., testing, documentation updates).

Your final output should be structured as follows:

<execute_md_output>
<selected_issue>
[Include the full details of the selected issue here]
</selected_issue>

<implementation_plan>
[Include acceptance criteria from GitHub issue and plan for implementation]
</implementation_plan>

<execution_log>
[Provide a detailed log of the steps taken to implement the issue, including any code changes, challenges encountered, and solutions applied]
</execution_log>

<summary>
[Summarize the changes made and any additional steps required]
</summary>
</execute_md_output>

Remember to interact with the user throughout the process, asking for clarification or additional information when needed. Your goal is to provide a clear and detailed execution of the selected GitHub issue.
