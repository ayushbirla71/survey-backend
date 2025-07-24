// Standard response helper functions

export const successResponse = (data: any, message = '') => {
  return {
    success: true,
    data,
    message
  };
};

export const errorResponse = (error: string, code = 'GENERAL_ERROR') => {
  return {
    success: false,
    error,
    code
  };
};

export const paginatedResponse = (data: any, pagination: any) => {
  return {
    success: true,
    data,
    pagination
  };
};

export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page: parseInt(page.toString()),
    limit: parseInt(limit.toString()),
    total,
    totalPages
  };
};
