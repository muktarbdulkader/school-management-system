import React from 'react';
import NotFound from '../../assets/images/not_found.png';
import Forbidden from '../../assets/images/forbidden_access.png';
import ServerError from '../../assets/images/server_error.png';

const FallbackImages = (status) => {
  switch (status) {
    case '404':
      return <img src={NotFound} alt="Not found" width={200} height={200} />;
    case '403':
      return (
        <img src={Forbidden} alt="Forbidden access" width={200} height={200} />
      );
    case '500':
      return (
        <img src={ServerError} alt="Server error" width={200} height={200} />
      );
    default:
      return null;
  }
};

const FallbackComponent = ({ status_code = '', title, message, action }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-40 py-8">
      {FallbackImages(status_code)}

      <p className="text-xl font-semibold">{title}</p>
      <p className="text-sm font-normal text-gray-500 my-1">{message}</p>

      {action && <div>{action}</div>}
    </div>
  );
};

export default FallbackComponent;
