-- Function to get most booked services
CREATE OR REPLACE FUNCTION get_popular_services(limit_count INT DEFAULT 4)
RETURNS TABLE (
  service_id UUID,
  booking_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as service_id,
    COUNT(aps.appointment_id) as booking_count
  FROM 
    services s
  JOIN 
    appointment_services aps ON s.id = aps.service_id
  GROUP BY 
    s.id
  ORDER BY 
    booking_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
