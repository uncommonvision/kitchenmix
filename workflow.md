I've been working on a project recently and created a new workflow. I think it could help. I've been intentially creating small issues in Github to maintain control over the LLM. The process may seem like too small of steps at the start, but once you get the hang of it you will find it easier to increase the sizing.

Setup:

Install github cli (known as gh)
Authenticate using "gh auth login"

My workflow:

1.  Create a Github issue in [the kanban](https://github.com/orgs/uncommonvision/projects/2/views/1)

- Add specific description with behaviors, functionality, and design expectations [My Example](https://github.com/uncommonvision/kitchenmix/issues/17)
- Mention the components to work on to limit scope to files
- Create issues about either api or web, not both
- Create supplemental issues (the inverse of the prior story)
- Assign yourself to the issue
- Create a label (typically an enhancement or a bug)
- Set a priority and size for the project work (important later when having the LLM pickup the work)

2. Open a terminal (bash) to your project directory

3. Start opencode.ai or claude.ai... I prefer opencode.ai at the moment - I can show you why later - might change to goose soon.

4. Give the LLM this prompt

Use the following for your workflow (be specific and stay in this sequential order):

- Review github issues and pick the highest priority issue
- Create branch using the gh cli using the command "gh issue develop (issue id) --base main --name (my gh username)/(issue type)/(lower cased issue title with dashes for spaces)”
- Fetch from origin and checkout the branch locally
- Use the issue description to define the work involved
- Create an issue comment with the work analysis, in markdown, for my review

5. Review the analysis
- Give feedback to the LLM
- Tell the LLM to create another comment or update the existing one

6. When ready, tell the LLM this prompt

Go ahead with your changes
Create a git commit with the files you've either modified or created
Push the current branch to origin
Create a pull request for the branch, set me as an assignee and add a label matching the issue label
