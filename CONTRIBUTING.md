# Contributing to Jupiter API Skill

Thank you for your interest in contributing to the Jupiter API Skill! This guide will help you add new documentation to the project.

## Adding API Endpoint Documentation

To document a new API endpoint:

1. **Create the endpoint file**: Add a new file in the `endpoints/` directory using the template at `_template.md`
   - Name the file using the API category ID (e.g., `ultra-swap-order.md` for the Ultra Swap Order API)

2. **Add response examples**: Create corresponding response documentation in the `responses/` directory

3. **Update the endpoint index**: Add the new category to the `_endpoints.md` file

## Adding API Behavior or Conceptual Documentation

To document API behavior, comparisons, or other conceptual topics:

1. **Create the file**: Add a new file in the `about/` directory with a descriptive name
   - Examples:
     - `ultra-swap-vs-metis-swap.md` for API comparisons
     - `common-errors.md` for error handling and debugging guides

## Important Guidelines

- **Reference all new files**: Every new file must be referenced in either `SKILL.md` or `_endpoints.md`
- **Keep files concise**: Files should not exceed 500 lines to maintain skill performance. If content is too long, split it into multiple files with appropriate cross-references
