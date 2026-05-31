-- Migration: Update students table to use class_id as foreign key instead of class text field
-- This migration changes the class field from a simple TEXT field to a foreign key reference to the classes table

-- Step 1: Add new class_id column as foreign key (nullable initially)
ALTER TABLE students ADD COLUMN class_id TEXT REFERENCES classes(id) ON DELETE SET NULL;

-- Step 2: Migrate existing data - map class names to class IDs
-- This assumes class names in the students table match class names in the classes table
UPDATE students s
SET class_id = c.id
FROM classes c
WHERE s.class = c.name;

-- Step 3: Make class_id NOT NULL after migration
ALTER TABLE students ALTER COLUMN class_id SET NOT NULL;

-- Step 4: Drop the old class TEXT column
ALTER TABLE students DROP COLUMN class;

-- Step 5: Rename class_id to class for consistency
ALTER TABLE students RENAME COLUMN class_id TO class;

-- Step 6: Create index on the new class foreign key for better query performance
CREATE INDEX IF NOT EXISTS idx_students_class_fk ON students(class);

-- Step 7: Update RLS policies if needed (they should still work with the renamed column)
-- The existing policies will automatically apply to the renamed column
