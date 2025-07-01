
# Sample CSV Files for Import

## Friends Import Format

The friends CSV file should contain the following columns:

### Required Fields:
- **name**: Full name of the friend
- **phone**: Phone number (any format accepted)

### Optional Fields:
- **group**: Category or group name (can be left empty)

### Example:
```csv
name,phone,group
Alice Johnson,+1-555-123-4567,Work Colleagues
Bob Smith,555-234-5678,Family
Charlie Brown,(555) 345-6789,College Friends
Diana Martinez,555.456.7890,
```

### Notes:
- The first row must contain headers: `name,phone,group`
- Phone numbers can be in any format (parentheses, dashes, dots, spaces)
- Group field can be empty - friends without groups will be listed under "No Group"
- Duplicate names will be detected and reported during import
- Invalid rows will be skipped with detailed error messages

### Download Sample File:
[friends-sample.csv](/samples/friends-sample.csv)
