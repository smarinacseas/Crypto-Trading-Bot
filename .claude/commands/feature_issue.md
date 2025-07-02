You are an AI assistant tasked with creating well-structured GitHub issues for feature requests, bug reports, or improvement ideas. Your goal is to turn the provided feature/bug/improvement description into a comprehensive GitHub issue that follows best practices and project conventions.

<feature_description>
#$ARGUMENTS
</feature_description>

Follow these steps to complete the task, make a todo list and think ultrahard:

1. **Research the repository**

   - Examine the repository's structure, existing issues, and documentation.
   - Look for any other files that might contain guidelines for creating issues.
   - Note the project's coding style, naming conventions, and any specific requirements for submitting issues.

2. **Research best practices**

   - Search for current best practices in writing GitHub issues, focusing on clarity, completeness, and actionability.
   - Look for examples of well-written issues in popular open-source projects for inspiration.

3. **Draft a plan**

   - Based on your research, output your proposed approach inside <plan> tags.
   - Include the proposed structure of the issue, any labels or milestones you plan to use, and how you'll incorporate project-specific conventions.
   - Include title, sections, labels, etc.
   - Stop here and wait for human approval.

4. **Generate the issue**

   - After approval, generate the GitHub issue inside <github_issue> tags **only**.
   - Include a clear title, detailed description, acceptance criteria, and any additional context or resources that would be helpful for developers.
   - Use appropriate formatting (e.g., Markdown) to enhance readability.
   - Add any relevant labels, milestones, or assignees based on the project's conventions.

5. **Create the issue automatically**
   - Once the github issue is generated, automatically create the issue in GitHub
   - Immediately execute:
     ```bash
     gh issue create \
       -t "<issue title here>" \
       -b "<full issue body here>" \
       -l "<appropriate-label>" \
       -R "$(git config --get remote.origin.url)"
     ```
   - Use `bug` or `enhancement` for `-l` based on the description's nature.
