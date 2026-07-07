Introduction


Writing useful commit messages is important part of the development process.

A commit message is also important part of deployment automation process so it requires some attention. Jenkins job will pick up the summary of the commit (via `git log --oneline`) and apart from listing it in the deployment notes it will also extract and link to Jira story related to the commit.

A good commit message
Re-establishing the context of a piece of code is wasteful. We can't avoid it completely, so our efforts should go to reducing it [as much] as possible. Commit messages can do exactly that and as a result, a commit message shows whether a developer is a good collaborator.

Peter Hutterer, http://who-t.blogspot.com/2009/12/on-commit-messages.html

Keep commit messages concise and consistent.

Well-crafted Git commit message is the best way to communicate context about a change to fellow developers (and indeed to their future selves). A diff will tell you what changed, but only the commit message can properly tell you why.

A good commit message should answer three questions:

Why is it necessary? It may fix a bug, it may add a feature, it may improve performance, reliability, stability, or just be a change for the sake of correctness.
How does it address the issue? For short obvious patches this part can be omitted, but it should be a high level description of what the approach was.
What effects does the patch have? (In addition to the obvious ones, this may include benchmarks, side effects, etc.)
A properly formed Git commit subject line should always be able to complete the following sentence: 

If applied, this commit will _your subject line here_.

Do not end the subject line with a period. Trailing punctuation is unnecessary in subject lines. Besides, space is precious when you’re trying to keep them to 50 chars or less.

Use the body to explain what and why vs. how. See this commit from Bitcoin Core is a great example of explaining what changed and why.

Proposed structure of commit message


Separate subject from body with a blank line
Include Jira issue in the subject
Limit the subject line to 50 characters
Capitalize the subject line
Do not end the subject line with a period
Use the imperative mood in the subject line
Wrap the body at 72 characters
Use the body to explain __what and why__ vs. how
Example of commit message structure implementation




Capitalized, short (50 chars or less) summary

More detailed explanatory text, if necessary. Wrap it to about 72
characters or so.  In some contexts, the first line is treated as the
subject of an email and the rest of the text as the body. The blank
line separating the summary from the body is critical (unless you omit
the body entirely); tools like rebase can get confused if you run the
two together.

Write your commit message in the imperative: "Fix bug" and not "Fixed bug"
 or "Fixes bug." This convention matches up with commit messages generated
by commands like git merge and git revert.

Further paragraphs come after blank lines.
- Bullet points are okay, too
- Typically a hyphen or asterisk is used for the bullet, followed by a single space, with blank lines in between, but conventions vary here

If you use an issue tracker, put references to them at the bottom,
like this:

Resolves: #123
See also: #456, #789



Example of a commit message structure in DLSR project


Add related story tag as the first thing on the summary line. It is used by automation to extract further data for deployment. If the commit is not related to any issue use `NOJIRA`.

The blank lines are important!



DLSR-69 View LS notes and tabs

Display blue vertical tabs in LS record detailed view.

- Update package.json with React version required for Tabs
- Add NotesView atom
- Update LostStolenResult view css with full column
- Add styles specific to Notes
- Add unit tests for Notes and update affected tests
- Update getOrDefault utility function used by Notes
- Update title and headers for LS record detailed view


Example of a commit message structure on command line


git commit -m 'NOJIRA Add open design proposals to utils' \
-m 'Create repository holding open design proposals.' \
-m '- Add open design proposals directory' \
-m '- Add placeholder directory for images' \
-m '- Add example ODP 0001 commit messages'