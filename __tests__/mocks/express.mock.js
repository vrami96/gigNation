const mockRequest = () => {
  const req = {};
  req.body = {};
  req.query = {};
  req.params = {};
  req.user = {};
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res;
};

module.exports = {
  mockRequest,
  mockResponse
}; 