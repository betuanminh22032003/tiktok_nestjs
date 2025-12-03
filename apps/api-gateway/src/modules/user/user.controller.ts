import { CurrentUser } from '@app/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@app/common/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, Observable } from 'rxjs';

interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

interface UserResponse {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
}

interface UpdateProfileDto {
  fullName?: string;
  bio?: string;
  avatar?: string;
}

interface SearchUsersResponse {
  users: UserResponse[];
  page: number;
  limit: number;
  total: number;
}

interface FollowResponse {
  success: boolean;
  isFollowing: boolean;
  followersCount?: number;
}

interface FollowStatusResponse {
  isFollowing: boolean;
  followerId: string;
  followingId: string;
}

interface FollowersListResponse {
  followerIds: string[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface FollowingListResponse {
  followingIds: string[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface AuthServiceClient {
  getUserById(data: { userId: string }): Observable<UserResponse>;
  updateProfile(data: {
    userId: string;
    fullName?: string;
    bio?: string;
    avatar?: string;
  }): Observable<UserResponse>;
  searchUsers(data: {
    query: string;
    page: number;
    limit: number;
  }): Observable<SearchUsersResponse>;
  getUsersByIds(data: { userIds: string[] }): Observable<{ users: UserResponse[] }>;
}

interface InteractionServiceClient {
  followUser(data: { followerId: string; followingId: string }): Observable<FollowResponse>;
  unfollowUser(data: { followerId: string; followingId: string }): Observable<FollowResponse>;
  getFollowStatus(data: {
    followerId: string;
    followingId: string;
  }): Observable<FollowStatusResponse>;
  getFollowers(data: {
    userId: string;
    page: number;
    limit: number;
  }): Observable<FollowersListResponse>;
  getFollowing(data: {
    userId: string;
    page: number;
    limit: number;
  }): Observable<FollowingListResponse>;
}

@ApiTags('Users')
@Controller('api/users')
export class UserController implements OnModuleInit {
  private authService: AuthServiceClient;
  private interactionService: InteractionServiceClient;

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientGrpc,
    @Inject('INTERACTION_SERVICE') private readonly interactionClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthServiceClient>('AuthService');
    this.interactionService =
      this.interactionClient.getService<InteractionServiceClient>('InteractionService');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Users found' })
  async searchUsers(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await lastValueFrom(
      this.authService.searchUsers({
        query: query || '',
        page: page || 1,
        limit: limit || 20,
      }),
    );
    return { success: true, data: result };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('userId') userId: string) {
    const user = await lastValueFrom(this.authService.getUserById({ userId }));
    return { success: true, data: user };
  }

  @Put(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Only allow users to update their own profile
    if (user.sub !== userId) {
      return { success: false, message: 'Forbidden' };
    }

    const updatedUser = await lastValueFrom(
      this.authService.updateProfile({
        userId,
        fullName: updateDto.fullName,
        bio: updateDto.bio,
        avatar: updateDto.avatar,
      }),
    );

    return { success: true, data: updatedUser };
  }

  @Post(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  async followUser(@Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    const result = await lastValueFrom(
      this.interactionService.followUser({
        followerId: user.sub,
        followingId: userId,
      }),
    );
    return { success: true, data: result };
  }

  @Delete(':userId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  async unfollowUser(@Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    const result = await lastValueFrom(
      this.interactionService.unfollowUser({
        followerId: user.sub,
        followingId: userId,
      }),
    );
    return { success: true, data: result };
  }

  @Get(':userId/follow-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if following a user' })
  @ApiResponse({ status: 200, description: 'Follow status retrieved' })
  async getFollowStatus(@Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    const result = await lastValueFrom(
      this.interactionService.getFollowStatus({
        followerId: user.sub,
        followingId: userId,
      }),
    );
    return { success: true, data: result };
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({ status: 200, description: 'Followers retrieved' })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await lastValueFrom(
      this.interactionService.getFollowers({
        userId,
        page: page || 1,
        limit: limit || 20,
      }),
    );

    // Fetch user details for followers
    if (result.followerIds && result.followerIds.length > 0) {
      const usersData = await lastValueFrom(
        this.authService.getUsersByIds({ userIds: result.followerIds }),
      );
      return {
        success: true,
        data: {
          users: usersData.users,
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore,
        },
      };
    }

    return {
      success: true,
      data: {
        users: [],
        page: result.page,
        limit: result.limit,
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  }

  @Get(':userId/following')
  @ApiOperation({ summary: 'Get users that this user is following' })
  @ApiResponse({ status: 200, description: 'Following list retrieved' })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await lastValueFrom(
      this.interactionService.getFollowing({
        userId,
        page: page || 1,
        limit: limit || 20,
      }),
    );

    // Fetch user details for following
    if (result.followingIds && result.followingIds.length > 0) {
      const usersData = await lastValueFrom(
        this.authService.getUsersByIds({ userIds: result.followingIds }),
      );
      return {
        success: true,
        data: {
          users: usersData.users,
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasMore: result.hasMore,
        },
      };
    }

    return {
      success: true,
      data: {
        users: [],
        page: result.page,
        limit: result.limit,
        total: result.total,
        hasMore: result.hasMore,
      },
    };
  }
}
