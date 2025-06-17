import React, { useEffect, useState } from 'react';

function History() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <p>Loading history...</p>;
  }

  return (
    <div>
      <h2>Prediction History</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default History;
