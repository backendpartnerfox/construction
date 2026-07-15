-- =====================================================================
-- CREATE lead_activities TABLE
-- Run this in pgAdmin before starting the backend.
-- =====================================================================

CREATE TABLE IF NOT EXISTS lead_activities (
    activity_id          SERIAL PRIMARY KEY,
    lead_id              INT  NOT NULL,
    activity_type        VARCHAR(30) NOT NULL
                         CHECK (activity_type IN (
                             'Call','Email','Meeting','Site_Visit',
                             'Follow_Up','Video_Call','Note'
                         )),
    activity_title       VARCHAR(255) NOT NULL,
    activity_description TEXT,
    scheduled_datetime   TIMESTAMP WITH TIME ZONE,
    duration_minutes     INT,
    priority             VARCHAR(20) DEFAULT 'Medium'
                         CHECK (priority IN ('Low','Medium','High','Urgent')),
    status               VARCHAR(20) DEFAULT 'Planned'
                         CHECK (status IN (
                             'Planned','In_Progress','Completed',
                             'Cancelled','Overdue'
                         )),
    completion_notes     TEXT,
    completed_at         TIMESTAMP WITH TIME ZONE,
    created_by           INT,
    updated_by           INT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lead_activities_lead
        FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE,
    CONSTRAINT fk_lead_activities_created_by
        FOREIGN KEY (created_by) REFERENCES employees(employee_id),
    CONSTRAINT fk_lead_activities_updated_by
        FOREIGN KEY (updated_by) REFERENCES employees(employee_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id      ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_status       ON lead_activities(status);
CREATE INDEX IF NOT EXISTS idx_lead_activities_scheduled_dt ON lead_activities(scheduled_datetime);

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lead_activities'
ORDER BY ordinal_position;
