-- Enable RLS on tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, edit own
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Jobs: Public can read open jobs, clients can CRUD own
CREATE POLICY "Anyone can view open jobs"
ON jobs FOR SELECT
TO authenticated, anon
USING (status = 'open' OR visibility = 'public');

CREATE POLICY "Clients can insert jobs"
ON jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own jobs"
ON jobs FOR UPDATE
TO authenticated
USING (auth.uid() = client_id);

-- Proposals: Freelancers can create, clients can view for their jobs
CREATE POLICY "Freelancers can create proposals"
ON proposals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (
  SELECT id FROM freelancer_profiles WHERE id = freelancer_id
));

CREATE POLICY "Job owners can view proposals"
ON proposals FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT client_id FROM jobs WHERE id = job_id
  )
  OR
  auth.uid() IN (
    SELECT id FROM freelancer_profiles WHERE id = freelancer_id
  )
);

-- Contracts: Only parties involved can access
CREATE POLICY "Contract parties can view"
ON contracts FOR SELECT
TO authenticated
USING (
  auth.uid() = client_id OR 
  auth.uid() IN (SELECT id FROM freelancer_profiles WHERE id = freelancer_id)
);

-- Messages: Only participants can access
CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Reviews: Public can read, participants can write
CREATE POLICY "Reviews are public"
ON reviews FOR SELECT
TO authenticated, anon
USING (is_public = true);

CREATE POLICY "Contract parties can create reviews"
ON reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id AND
  auth.uid() IN (
    SELECT client_id FROM contracts WHERE id = contract_id
    UNION
    SELECT freelancer_id FROM contracts WHERE id = contract_id
  )
);
