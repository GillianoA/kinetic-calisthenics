-- Curated, immutable system catalog. Difficulty is an approximate global
-- ordering for discovery; progression stages are the source of truth for each
-- skill's percentage.

insert into public.exercise_library (
  id,
  owner_id,
  name,
  category,
  description,
  primary_muscles,
  equipment,
  is_system
)
values
  ('20000000-0000-4000-8000-000000000001', null, 'Push-Up', 'push', 'Strict floor push-up.', array['chest','triceps','anterior deltoids'], '{}', true),
  ('20000000-0000-4000-8000-000000000002', null, 'Diamond Push-Up', 'push', 'Close-hand push-up with a controlled range.', array['triceps','chest'], '{}', true),
  ('20000000-0000-4000-8000-000000000003', null, 'Pike Push-Up', 'push', 'Vertical pressing preparation.', array['shoulders','triceps'], '{}', true),
  ('20000000-0000-4000-8000-000000000004', null, 'Pull-Up', 'pull', 'Strict pronated-grip pull-up.', array['lats','biceps','upper back'], array['pull-up bar'], true),
  ('20000000-0000-4000-8000-000000000005', null, 'Chin-Up', 'pull', 'Strict supinated-grip chin-up.', array['lats','biceps'], array['pull-up bar'], true),
  ('20000000-0000-4000-8000-000000000006', null, 'Dip', 'push', 'Strict parallel-bar dip.', array['chest','triceps','shoulders'], array['parallel bars'], true),
  ('20000000-0000-4000-8000-000000000007', null, 'Muscle-Up', 'pull', 'Pull and transition above a bar.', array['lats','biceps','chest','triceps'], array['pull-up bar'], true),
  ('20000000-0000-4000-8000-000000000008', null, 'Handstand Practice', 'balance', 'Wall or freestanding handstand practice.', array['shoulders','core','forearms'], '{}', true),
  ('20000000-0000-4000-8000-000000000009', null, 'L-Sit Hold', 'core', 'Straight-arm support with legs horizontal.', array['core','hip flexors','triceps'], array['parallettes'], true),
  ('20000000-0000-4000-8000-000000000010', null, 'V-Sit', 'core', 'Advanced compression hold above an L-sit.', array['core','hip flexors','triceps'], array['parallettes'], true),
  ('20000000-0000-4000-8000-000000000011', null, 'Planche Lean', 'push', 'Straight-arm lean used for planche preparation.', array['shoulders','chest','core'], array['parallettes'], true),
  ('20000000-0000-4000-8000-000000000012', null, 'Front Lever Hold', 'pull', 'Horizontal face-up straight-arm hold.', array['lats','core','upper back'], array['pull-up bar'], true),
  ('20000000-0000-4000-8000-000000000013', null, 'Back Lever Hold', 'pull', 'Horizontal face-down straight-arm hold.', array['shoulders','chest','core'], array['rings'], true),
  ('20000000-0000-4000-8000-000000000014', null, 'Pistol Squat', 'legs', 'Single-leg squat through a controlled full range.', array['quadriceps','glutes','hamstrings'], '{}', true),
  ('20000000-0000-4000-8000-000000000015', null, 'Nordic Curl', 'legs', 'Kneeling eccentric or full hamstring curl.', array['hamstrings','glutes'], '{}', true),
  ('20000000-0000-4000-8000-000000000016', null, 'Dragon Flag', 'core', 'Rigid-body lever raise and lower from a bench.', array['core','lats'], array['bench'], true),
  ('20000000-0000-4000-8000-000000000017', null, 'Human Flag', 'core', 'Sideways body hold on a vertical support.', array['obliques','shoulders','lats'], array['vertical pole'], true),
  ('20000000-0000-4000-8000-000000000018', null, 'Hollow Body Hold', 'core', 'Posterior pelvic-tilt bodyline hold.', array['core'], '{}', true),
  ('20000000-0000-4000-8000-000000000019', null, 'Bodyweight Squat', 'legs', 'Controlled bilateral squat.', array['quadriceps','glutes'], '{}', true),
  ('20000000-0000-4000-8000-000000000020', null, 'Australian Row', 'pull', 'Horizontal bodyweight row.', array['upper back','lats','biceps'], array['low bar'], true);

insert into public.skills (
  id,
  owner_id,
  name,
  category,
  description,
  difficulty_order,
  is_system
)
values
  ('30000000-0000-4000-8000-000000000001', null, 'Push-Up', 'push', 'A strict push-up with a stable body line.', 10, true),
  ('30000000-0000-4000-8000-000000000002', null, 'Diamond Push-Up', 'push', 'A close-hand push-up emphasizing triceps strength.', 20, true),
  ('30000000-0000-4000-8000-000000000003', null, 'Pike Push-Up', 'push', 'A bodyweight vertical press progression.', 25, true),
  ('30000000-0000-4000-8000-000000000004', null, 'Handstand', 'balance', 'A controlled freestanding inverted balance.', 40, true),
  ('30000000-0000-4000-8000-000000000005', null, 'Handstand Push-Up', 'push', 'A full-range inverted bodyweight press.', 65, true),
  ('30000000-0000-4000-8000-000000000006', null, 'Pull-Up', 'pull', 'A strict overhand pull from hang to chin over bar.', 30, true),
  ('30000000-0000-4000-8000-000000000007', null, 'Chin-Up', 'pull', 'A strict underhand pull from hang to chin over bar.', 28, true),
  ('30000000-0000-4000-8000-000000000008', null, 'Muscle-Up', 'dynamic', 'A powerful pull and controlled bar transition.', 70, true),
  ('30000000-0000-4000-8000-000000000009', null, 'Dip', 'push', 'A controlled parallel-bar dip below ninety degrees.', 25, true),
  ('30000000-0000-4000-8000-000000000010', null, 'L-Sit', 'core', 'A supported straight-leg horizontal hold.', 35, true),
  ('30000000-0000-4000-8000-000000000011', null, 'V-Sit', 'core', 'An advanced high-compression support hold.', 75, true),
  ('30000000-0000-4000-8000-000000000012', null, 'Tuck Planche', 'static', 'A tucked horizontal straight-arm support.', 50, true),
  ('30000000-0000-4000-8000-000000000013', null, 'Advanced Tuck Planche', 'static', 'An open-hip tuck planche.', 60, true),
  ('30000000-0000-4000-8000-000000000014', null, 'Straddle Planche', 'static', 'A straight-body planche with straddled legs.', 85, true),
  ('30000000-0000-4000-8000-000000000015', null, 'Full Planche', 'static', 'A straight-body, feet-together planche.', 100, true),
  ('30000000-0000-4000-8000-000000000016', null, 'Tuck Front Lever', 'static', 'A tucked horizontal front lever.', 48, true),
  ('30000000-0000-4000-8000-000000000017', null, 'Advanced Tuck Front Lever', 'static', 'An open-hip tuck front lever.', 58, true),
  ('30000000-0000-4000-8000-000000000018', null, 'Straddle Front Lever', 'static', 'A straight-body front lever with straddled legs.', 80, true),
  ('30000000-0000-4000-8000-000000000019', null, 'Full Front Lever', 'static', 'A straight-body, feet-together front lever.', 95, true),
  ('30000000-0000-4000-8000-000000000020', null, 'Back Lever', 'static', 'A straight-body horizontal back lever.', 72, true),
  ('30000000-0000-4000-8000-000000000021', null, 'Pistol Squat', 'legs', 'A controlled full-range single-leg squat.', 45, true),
  ('30000000-0000-4000-8000-000000000022', null, 'Nordic Curl', 'legs', 'A controlled full-range Nordic hamstring curl.', 55, true),
  ('30000000-0000-4000-8000-000000000023', null, 'Dragon Flag', 'core', 'A rigid-body dragon flag raise and lower.', 65, true),
  ('30000000-0000-4000-8000-000000000024', null, 'Human Flag', 'static', 'A straight sideways hold on a vertical support.', 90, true);

insert into public.skill_progressions (
  id,
  skill_id,
  name,
  stage_order,
  description
)
values
  ('31000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000001', 'Wall Push-Up', 1, 'Controlled repetitions against a wall.'),
  ('31000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000001', 'Incline Push-Up', 2, 'Full-range repetitions on an elevated surface.'),
  ('31000000-0000-4000-8000-000000000103', '30000000-0000-4000-8000-000000000001', 'Knee Push-Up', 3, 'Stable body line from knees through shoulders.'),
  ('31000000-0000-4000-8000-000000000104', '30000000-0000-4000-8000-000000000001', 'Strict Push-Up', 4, 'Chest reaches depth with a rigid full body line.'),

  ('31000000-0000-4000-8000-000000000201', '30000000-0000-4000-8000-000000000002', 'Narrow Incline Push-Up', 1, 'Close-hand repetitions on an elevated surface.'),
  ('31000000-0000-4000-8000-000000000202', '30000000-0000-4000-8000-000000000002', 'Knee Diamond Push-Up', 2, 'Diamond hand position from the knees.'),
  ('31000000-0000-4000-8000-000000000203', '30000000-0000-4000-8000-000000000002', 'Strict Diamond Push-Up', 3, 'Full-range floor repetitions.'),

  ('31000000-0000-4000-8000-000000000301', '30000000-0000-4000-8000-000000000003', 'Incline Pike Press', 1, 'Pike press with hands elevated.'),
  ('31000000-0000-4000-8000-000000000302', '30000000-0000-4000-8000-000000000003', 'Floor Pike Push-Up', 2, 'Head travels forward and down between hands.'),
  ('31000000-0000-4000-8000-000000000303', '30000000-0000-4000-8000-000000000003', 'Feet-Elevated Pike Push-Up', 3, 'Vertical press with feet elevated.'),

  ('31000000-0000-4000-8000-000000000401', '30000000-0000-4000-8000-000000000004', 'Wall-Facing Handstand', 1, 'Stacked wall-facing hold with active shoulders.'),
  ('31000000-0000-4000-8000-000000000402', '30000000-0000-4000-8000-000000000004', 'Wall Heel Pulls', 2, 'Briefly separate both heels while controlling balance.'),
  ('31000000-0000-4000-8000-000000000403', '30000000-0000-4000-8000-000000000004', 'Freestanding Balance', 3, 'Repeatable freestanding holds.'),
  ('31000000-0000-4000-8000-000000000404', '30000000-0000-4000-8000-000000000004', '30-Second Handstand', 4, 'Controlled freestanding thirty-second hold.'),

  ('31000000-0000-4000-8000-000000000501', '30000000-0000-4000-8000-000000000005', 'Feet-Elevated Pike Press', 1, 'Strong elevated pike repetitions.'),
  ('31000000-0000-4000-8000-000000000502', '30000000-0000-4000-8000-000000000005', 'Partial Wall HSPU', 2, 'Controlled partial-range wall repetitions.'),
  ('31000000-0000-4000-8000-000000000503', '30000000-0000-4000-8000-000000000005', 'Full Wall HSPU', 3, 'Head to target through full wall-supported range.'),
  ('31000000-0000-4000-8000-000000000504', '30000000-0000-4000-8000-000000000005', 'Freestanding HSPU', 4, 'Controlled freestanding full-range repetition.'),

  ('31000000-0000-4000-8000-000000000601', '30000000-0000-4000-8000-000000000006', 'Scapular Pull-Up', 1, 'Straight-arm scapular depression from a hang.'),
  ('31000000-0000-4000-8000-000000000602', '30000000-0000-4000-8000-000000000006', 'Band-Assisted Pull-Up', 2, 'Full range with measurable assistance.'),
  ('31000000-0000-4000-8000-000000000603', '30000000-0000-4000-8000-000000000006', 'Negative Pull-Up', 3, 'Controlled five-second eccentric.'),
  ('31000000-0000-4000-8000-000000000604', '30000000-0000-4000-8000-000000000006', 'Strict Pull-Up', 4, 'Dead hang to chin over the bar without kip.'),

  ('31000000-0000-4000-8000-000000000701', '30000000-0000-4000-8000-000000000007', 'Supinated Active Hang', 1, 'Active shoulder position with an underhand grip.'),
  ('31000000-0000-4000-8000-000000000702', '30000000-0000-4000-8000-000000000007', 'Band-Assisted Chin-Up', 2, 'Full range with measurable assistance.'),
  ('31000000-0000-4000-8000-000000000703', '30000000-0000-4000-8000-000000000007', 'Negative Chin-Up', 3, 'Controlled five-second eccentric.'),
  ('31000000-0000-4000-8000-000000000704', '30000000-0000-4000-8000-000000000007', 'Strict Chin-Up', 4, 'Dead hang to chin over the bar without kip.'),

  ('31000000-0000-4000-8000-000000000801', '30000000-0000-4000-8000-000000000008', 'Chest-to-Bar Pull', 1, 'Powerful high pull toward the lower chest.'),
  ('31000000-0000-4000-8000-000000000802', '30000000-0000-4000-8000-000000000008', 'Low-Bar Transition', 2, 'Controlled transition drill on a low bar.'),
  ('31000000-0000-4000-8000-000000000803', '30000000-0000-4000-8000-000000000008', 'Band-Assisted Muscle-Up', 3, 'Full movement with measurable assistance.'),
  ('31000000-0000-4000-8000-000000000804', '30000000-0000-4000-8000-000000000008', 'Strict Muscle-Up', 4, 'Clean pull and transition without an excessive kip.'),

  ('31000000-0000-4000-8000-000000000901', '30000000-0000-4000-8000-000000000009', 'Support Hold', 1, 'Stable straight-arm parallel-bar support.'),
  ('31000000-0000-4000-8000-000000000902', '30000000-0000-4000-8000-000000000009', 'Assisted Dip', 2, 'Full-range dip with foot or band assistance.'),
  ('31000000-0000-4000-8000-000000000903', '30000000-0000-4000-8000-000000000009', 'Negative Dip', 3, 'Controlled eccentric below ninety degrees.'),
  ('31000000-0000-4000-8000-000000000904', '30000000-0000-4000-8000-000000000009', 'Strict Dip', 4, 'Full-range repetition with locked-out support.'),

  ('31000000-0000-4000-8000-000000001001', '30000000-0000-4000-8000-000000000010', 'Tuck Support', 1, 'Knees lifted in a stable straight-arm support.'),
  ('31000000-0000-4000-8000-000000001002', '30000000-0000-4000-8000-000000000010', 'One-Leg L-Sit', 2, 'Alternate one straight leg at horizontal.'),
  ('31000000-0000-4000-8000-000000001003', '30000000-0000-4000-8000-000000000010', 'Full L-Sit', 3, 'Both legs straight and horizontal.'),

  ('31000000-0000-4000-8000-000000001101', '30000000-0000-4000-8000-000000000011', 'Seated Compression Lift', 1, 'Lift straight heels from a seated pike.'),
  ('31000000-0000-4000-8000-000000001102', '30000000-0000-4000-8000-000000000011', 'High L-Sit', 2, 'Raise straight legs above horizontal.'),
  ('31000000-0000-4000-8000-000000001103', '30000000-0000-4000-8000-000000000011', 'Tuck V-Sit', 3, 'High supported hold with tucked knees.'),
  ('31000000-0000-4000-8000-000000001104', '30000000-0000-4000-8000-000000000011', 'Full V-Sit', 4, 'Straight legs held high above horizontal.'),

  ('31000000-0000-4000-8000-000000001201', '30000000-0000-4000-8000-000000000012', 'Planche Lean', 1, 'Protract and lean with feet grounded.'),
  ('31000000-0000-4000-8000-000000001202', '30000000-0000-4000-8000-000000000012', 'Frog Stand', 2, 'Balanced bent-arm tucked support.'),
  ('31000000-0000-4000-8000-000000001203', '30000000-0000-4000-8000-000000000012', 'Tuck Planche', 3, 'Both feet clear in a straight-arm tuck.'),

  ('31000000-0000-4000-8000-000000001301', '30000000-0000-4000-8000-000000000013', 'Solid Tuck Planche', 1, 'Repeatable ten-second tuck planche.'),
  ('31000000-0000-4000-8000-000000001302', '30000000-0000-4000-8000-000000000013', 'Open Tuck Planche', 2, 'Gradually open hips while retaining height.'),
  ('31000000-0000-4000-8000-000000001303', '30000000-0000-4000-8000-000000000013', 'Advanced Tuck Planche', 3, 'Open-hip horizontal tuck hold.'),

  ('31000000-0000-4000-8000-000000001401', '30000000-0000-4000-8000-000000000014', 'Advanced Tuck Planche', 1, 'Strong advanced tuck hold.'),
  ('31000000-0000-4000-8000-000000001402', '30000000-0000-4000-8000-000000000014', 'Band-Assisted Straddle', 2, 'Straight-leg straddle with measurable assistance.'),
  ('31000000-0000-4000-8000-000000001403', '30000000-0000-4000-8000-000000000014', 'Straddle Planche', 3, 'Unassisted horizontal straddle hold.'),

  ('31000000-0000-4000-8000-000000001501', '30000000-0000-4000-8000-000000000015', 'Straddle Planche', 1, 'Repeatable straddle planche hold.'),
  ('31000000-0000-4000-8000-000000001502', '30000000-0000-4000-8000-000000000015', 'Half-Lay Planche', 2, 'Narrow-leg or half-lay transition hold.'),
  ('31000000-0000-4000-8000-000000001503', '30000000-0000-4000-8000-000000000015', 'Band-Assisted Full Planche', 3, 'Feet together with measurable assistance.'),
  ('31000000-0000-4000-8000-000000001504', '30000000-0000-4000-8000-000000000015', 'Full Planche', 4, 'Unassisted straight-body planche.'),

  ('31000000-0000-4000-8000-000000001601', '30000000-0000-4000-8000-000000000016', 'Inverted Hang', 1, 'Stable straight-arm inverted hang.'),
  ('31000000-0000-4000-8000-000000001602', '30000000-0000-4000-8000-000000000016', 'Tuck Lever Lower', 2, 'Controlled tucked lowering toward horizontal.'),
  ('31000000-0000-4000-8000-000000001603', '30000000-0000-4000-8000-000000000016', 'Tuck Front Lever', 3, 'Horizontal tucked hold.'),

  ('31000000-0000-4000-8000-000000001701', '30000000-0000-4000-8000-000000000017', 'Solid Tuck Front Lever', 1, 'Repeatable ten-second tuck hold.'),
  ('31000000-0000-4000-8000-000000001702', '30000000-0000-4000-8000-000000000017', 'Open Tuck Front Lever', 2, 'Gradually open hips at horizontal.'),
  ('31000000-0000-4000-8000-000000001703', '30000000-0000-4000-8000-000000000017', 'Advanced Tuck Front Lever', 3, 'Open-hip horizontal tuck hold.'),

  ('31000000-0000-4000-8000-000000001801', '30000000-0000-4000-8000-000000000018', 'Advanced Tuck Front Lever', 1, 'Strong advanced tuck hold.'),
  ('31000000-0000-4000-8000-000000001802', '30000000-0000-4000-8000-000000000018', 'One-Leg Front Lever', 2, 'Alternate a fully extended leg.'),
  ('31000000-0000-4000-8000-000000001803', '30000000-0000-4000-8000-000000000018', 'Straddle Front Lever', 3, 'Unassisted horizontal straddle hold.'),

  ('31000000-0000-4000-8000-000000001901', '30000000-0000-4000-8000-000000000019', 'Straddle Front Lever', 1, 'Repeatable straddle hold.'),
  ('31000000-0000-4000-8000-000000001902', '30000000-0000-4000-8000-000000000019', 'Half-Lay Front Lever', 2, 'Narrow-leg transition hold.'),
  ('31000000-0000-4000-8000-000000001903', '30000000-0000-4000-8000-000000000019', 'Full Front Lever', 3, 'Unassisted straight-body hold.'),

  ('31000000-0000-4000-8000-000000002001', '30000000-0000-4000-8000-000000000020', 'Skin the Cat', 1, 'Controlled rotation through shoulder extension.'),
  ('31000000-0000-4000-8000-000000002002', '30000000-0000-4000-8000-000000000020', 'Tuck Back Lever', 2, 'Horizontal tucked hold.'),
  ('31000000-0000-4000-8000-000000002003', '30000000-0000-4000-8000-000000000020', 'Advanced Tuck Back Lever', 3, 'Open-hip horizontal tuck hold.'),
  ('31000000-0000-4000-8000-000000002004', '30000000-0000-4000-8000-000000000020', 'Full Back Lever', 4, 'Unassisted straight-body hold.'),

  ('31000000-0000-4000-8000-000000002101', '30000000-0000-4000-8000-000000000021', 'Box Pistol Squat', 1, 'Single-leg squat to a raised target.'),
  ('31000000-0000-4000-8000-000000002102', '30000000-0000-4000-8000-000000000021', 'Assisted Pistol Squat', 2, 'Full depth with light hand assistance.'),
  ('31000000-0000-4000-8000-000000002103', '30000000-0000-4000-8000-000000000021', 'Counterweighted Pistol Squat', 3, 'Full depth using a small counterweight.'),
  ('31000000-0000-4000-8000-000000002104', '30000000-0000-4000-8000-000000000021', 'Strict Pistol Squat', 4, 'Unassisted controlled full-range repetition.'),

  ('31000000-0000-4000-8000-000000002201', '30000000-0000-4000-8000-000000000022', 'High-Support Nordic Eccentric', 1, 'Short-range eccentric with elevated support.'),
  ('31000000-0000-4000-8000-000000002202', '30000000-0000-4000-8000-000000000022', 'Full Nordic Eccentric', 2, 'Controlled full-range lowering.'),
  ('31000000-0000-4000-8000-000000002203', '30000000-0000-4000-8000-000000000022', 'Assisted Nordic Curl', 3, 'Full range with band or hand assistance.'),
  ('31000000-0000-4000-8000-000000002204', '30000000-0000-4000-8000-000000000022', 'Full Nordic Curl', 4, 'Controlled eccentric and concentric repetition.'),

  ('31000000-0000-4000-8000-000000002301', '30000000-0000-4000-8000-000000000023', 'Dragon Flag Negative', 1, 'Controlled eccentric with a rigid torso.'),
  ('31000000-0000-4000-8000-000000002302', '30000000-0000-4000-8000-000000000023', 'Single-Leg Dragon Flag', 2, 'Full motion with one leg tucked.'),
  ('31000000-0000-4000-8000-000000002303', '30000000-0000-4000-8000-000000000023', 'Full Dragon Flag', 3, 'Rigid-body raise and controlled lowering.'),

  ('31000000-0000-4000-8000-000000002401', '30000000-0000-4000-8000-000000000024', 'Vertical Flag', 1, 'Stacked vertical support on a pole.'),
  ('31000000-0000-4000-8000-000000002402', '30000000-0000-4000-8000-000000000024', 'Tuck Human Flag', 2, 'Sideways support with both knees tucked.'),
  ('31000000-0000-4000-8000-000000002403', '30000000-0000-4000-8000-000000000024', 'Straddle Human Flag', 3, 'Sideways support with straddled legs.'),
  ('31000000-0000-4000-8000-000000002404', '30000000-0000-4000-8000-000000000024', 'Full Human Flag', 4, 'Straight-body sideways hold.');
