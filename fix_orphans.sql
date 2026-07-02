DELETE FROM content_views cv
WHERE cv.user_id IS NOT NULL
AND cv.user_id NOT IN (SELECT id FROM users);
