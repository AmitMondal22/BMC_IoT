const userService = require('./user.service');
const response = require('../../utils/response');

class UserController {
  async list(request, reply) {
    const result = await userService.list(request.query, request.userId, request.userRole);
    return response.paginated(reply, result.users, result.pagination, 'Users fetched');
  }

  async getById(request, reply) {
    const user = await userService.getById(request.params.id);
    return response.success(reply, user, 'User fetched');
  }

  async create(request, reply) {
    const user = await userService.create(request.body, request.userId, request.userRole);
    return response.created(reply, user, 'User created successfully');
  }

  async update(request, reply) {
    const user = await userService.update(request.params.id, request.body, request.userId, request.userRole);
    return response.success(reply, user, 'User updated successfully');
  }

  async delete(request, reply) {
    const result = await userService.delete(request.params.id, request.userId, request.userRole);
    return response.success(reply, null, result.message);
  }

  async resetPassword(request, reply) {
    const { password } = request.body;
    const result = await userService.resetPassword(request.params.id, password, request.userId, request.userRole);
    return response.success(reply, null, result.message);
  }

  async assignDevices(request, reply) {
    const result = await userService.assignDevices(request.params.id, request.body.deviceIds);
    return response.success(reply, null, result.message);
  }
}

module.exports = new UserController();
