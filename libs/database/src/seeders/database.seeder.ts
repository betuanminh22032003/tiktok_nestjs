import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';
import { Video } from '../entities/video.entity';
import * as bcrypt from 'bcrypt';

export class DatabaseSeeder {
  private userRepository = AppDataSource.getRepository(User);
  private videoRepository = AppDataSource.getRepository(Video);

  async seed() {
    console.log('🌱 Starting database seeding...');

    try {
      // Check if data already exists
      const userCount = await this.userRepository.count();
      if (userCount > 0) {
        console.log('⚠️  Database already has data. Skipping seed.');
        return;
      }

      // Seed users
      const users = await this.seedUsers();
      console.log(`✅ Created ${users.length} users`);

      // Seed videos
      const videos = await this.seedVideos(users);
      console.log(`✅ Created ${videos.length} videos`);

      console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  private async seedUsers(): Promise<User[]> {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const usersData = [
      {
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: hashedPassword,
        fullName: 'John Doe',
        bio: 'Content creator and tech enthusiast 🚀',
        isActive: true,
      },
      {
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: hashedPassword,
        fullName: 'Jane Smith',
        bio: 'Travel blogger | Photography lover 📸',
        isActive: true,
      },
      {
        email: 'mike.johnson@example.com',
        username: 'mikejohnson',
        password: hashedPassword,
        fullName: 'Mike Johnson',
        bio: 'Fitness coach | Motivation speaker 💪',
        isActive: true,
      },
      {
        email: 'sarah.williams@example.com',
        username: 'sarahwilliams',
        password: hashedPassword,
        fullName: 'Sarah Williams',
        bio: 'Food blogger | Recipe creator 🍳',
        isActive: true,
      },
      {
        email: 'david.brown@example.com',
        username: 'davidbrown',
        password: hashedPassword,
        fullName: 'David Brown',
        bio: 'Music producer | DJ 🎵',
        isActive: true,
      },
    ];

    const users: User[] = [];
    for (const userData of usersData) {
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      users.push(savedUser);
    }

    return users;
  }

  private async seedVideos(users: User[]): Promise<Video[]> {
    const videosData = [
      {
        title: 'My First TikTok!',
        description: 'Welcome to my channel! #firstpost #newcreator',
        videoUrl: 'https://example.com/videos/sample1.mp4',
        thumbnailUrl: 'https://example.com/thumbnails/sample1.jpg',
        duration: 15,
        views: 1250,
        likesCount: 89,
        commentsCount: 12,
        isPublic: true,
      },
      {
        title: 'Amazing Travel Destination',
        description: 'Check out this beautiful place! #travel #adventure',
        videoUrl: 'https://example.com/videos/sample2.mp4',
        thumbnailUrl: 'https://example.com/thumbnails/sample2.jpg',
        duration: 30,
        views: 5420,
        likesCount: 342,
        commentsCount: 45,
        isPublic: true,
      },
      {
        title: 'Quick Workout Routine',
        description: '5-minute morning workout | #fitness #health',
        videoUrl: 'https://example.com/videos/sample3.mp4',
        thumbnailUrl: 'https://example.com/thumbnails/sample3.jpg',
        duration: 45,
        views: 8900,
        likesCount: 567,
        commentsCount: 78,
        isPublic: true,
      },
      {
        title: 'Easy Pasta Recipe',
        description: 'Cook this delicious pasta in 15 minutes! #cooking #recipe',
        videoUrl: 'https://example.com/videos/sample4.mp4',
        thumbnailUrl: 'https://example.com/thumbnails/sample4.jpg',
        duration: 60,
        views: 12500,
        likesCount: 890,
        commentsCount: 123,
        isPublic: true,
      },
      {
        title: 'Behind The Music',
        description: 'Studio session vibes 🎶 #music #producer',
        videoUrl: 'https://example.com/videos/sample5.mp4',
        thumbnailUrl: 'https://example.com/thumbnails/sample5.jpg',
        duration: 20,
        views: 3400,
        likesCount: 234,
        commentsCount: 34,
        isPublic: true,
      },
    ];

    const videos: Video[] = [];
    for (let i = 0; i < videosData.length; i++) {
      const videoData = videosData[i];
      const user = users[i % users.length]; // Distribute videos among users

      const video = this.videoRepository.create({
        ...videoData,
        userId: user.id,
        user: user,
      });

      const savedVideo = await this.videoRepository.save(video);
      videos.push(savedVideo);
    }

    return videos;
  }

  async clear() {
    console.log('🗑️  Clearing database...');

    try {
      await this.videoRepository.delete({});
      await this.userRepository.delete({});

      console.log('✅ Database cleared successfully!');
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      throw error;
    }
  }
}
