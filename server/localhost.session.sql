CREATE TABLE T3_locality (address TEXT, locality VARCHAR(255));
select *
from T3_locality;
DELETE FROM T3_locality
WHERE ctid NOT IN (
        SELECT MIN(ctid)
        FROM T3_locality
        GROUP BY address,
            locality
    );