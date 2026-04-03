-- Force PostgREST to reload schema after notifications table changes.
NOTIFY pgrst, 'reload schema';
