-- ============================================================
-- STEP 1: Clean up orphaned student user rows from previous
--         failed imports. Run this FIRST.
-- ============================================================
DELETE FROM public.users
WHERE role = 'student';

-- ============================================================
-- STEP 2: Fix the trigger so future re-imports never fail
--         with duplicate email errors.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
    -- Upsert into public.users so that re-importing students doesn't fail
    -- with duplicate email errors. ON CONFLICT updates the existing record.
    INSERT INTO public.users (id, email, role, student_id, display_name)
    VALUES (
        gen_random_uuid(), 
        NEW.usn || '@forge.local', 
        'student', 
        NEW.id, 
        NEW.name
    )
    ON CONFLICT (email) DO UPDATE
        SET student_id   = EXCLUDED.student_id,
            display_name = EXCLUDED.display_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
