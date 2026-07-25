-- These are first-class choices in the workout form. Keeping them in the
-- database enum prevents a selected training focus from being collapsed into
-- the generic "strength" type.
alter type public.workout_type add value if not exists 'push';
alter type public.workout_type add value if not exists 'pull';
alter type public.workout_type add value if not exists 'legs';
