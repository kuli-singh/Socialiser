
# Sample CSV Files for Import

## Friends Import Format

The friends CSV file should contain the following columns:

### Required Fields:
- **name**: Full name of the friend

### Optional Fields:
- **group**: Category or group name (can be left empty)

### Example:
```csv
name,group
Alice Johnson,Work Colleagues
Bob Smith,Family
Charlie Brown,College Friends
Diana Martinez,
```

### Notes:
- The first row must contain headers: `name,group`
- Group field can be empty - friends without groups will be listed under "No Group"
- Duplicate names will be detected and reported during import
- Invalid rows will be skipped with detailed error messages

### Download Sample File:
[friends-sample.csv](/samples/friends-sample.csv)
