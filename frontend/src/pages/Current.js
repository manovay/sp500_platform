import React, { useEffect, useState } from 'react';

function Current() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/current')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <p>Loading current allocation...</p>;
  }

  return (
    <div>
      <h2>Current Allocation</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default Current;
