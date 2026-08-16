import { Country, Province, City } from '../db/schema.ts';
import { Post, Message, Notification, Comment, Connection, Story } from '../types.ts';

export interface ILocationRepository {
  getAllCountries(): Promise<Country[]>;
  getProvincesByCountryId(countryId: string | number): Promise<Province[]>;
  getCitiesByProvinceId(provinceId: string | number): Promise<City[]>;
  searchCountries(keyword: string, limit: number): Promise<Country[]>;
  getCountryByIso2(iso2: string): Promise<Country | null>;
  getProvinces(countryId: number): Promise<Province[]>;
  searchProvinces(countryId: number, keyword: string, limit: number): Promise<Province[]>;
  getCities(provinceId: number): Promise<City[]>;
  searchCities(provinceId: number, keyword: string, limit: number): Promise<City[]>;
}

export interface IPostRepository {
    list(limit?: number, groupId?: string, search?: string, tag?: string, userId?: string, page?: number, pageSize?: number): Promise<Post[]>;
    create(post: Omit<Post, 'id' | 'timestamp'>): Promise<Post>;
    findById(id: string): Promise<Post | null>;
    delete(id: string): Promise<void>;
    update(post: Post): Promise<void>;
    filter(predicate: (post: Post) => boolean): Promise<Post[]>;
}

export interface IMessageRepository {
    list(): Promise<Message[]>;
    listAllForUser(userId: string): Promise<Message[]>;
    listHistory(userId: string, partnerId: string): Promise<Message[]>;
    findById(id: string): Promise<Message | null>;
    create(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message>;
    update(message: Message): Promise<void>;
    markAsRead(senderId: string, receiverId: string): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface INotificationRepository {
    list(): Promise<Notification[]>;
    listByUserId(userId: string): Promise<Notification[]>;
    findById(id: string): Promise<Notification | null>;
    create(notification: Omit<Notification, 'id'> & { id?: string }): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
    delete(id: string): Promise<void>;
    update(id: string, updates: Partial<Notification>): Promise<void>;
}

export interface ICommentRepository {
    listByPostId(postId: string): Promise<Comment[]>;
    list(): Promise<Comment[]>;
    create(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment>;
    delete(id: string): Promise<void>;
}

export interface IStoryRepository {
    list(): Promise<Story[]>;
    create(story: Omit<Story, 'id' | 'timestamp'>): Promise<Story>;
    delete(id: string): Promise<void>;
    recordView?(storyId: string, viewerUserId: string): Promise<any[]>;
    getViewers?(storyId: string): Promise<any[]>;
}

export interface IFollowRepository {
    listFollowers(userId: string): Promise<string[]>;
    listFollowing(userId: string): Promise<string[]>;
    list(): Promise<{followerId: string, followingId: string}[]>;
    follow(followerId: string, followingId: string): Promise<void>;
    unfollow(followerId: string, followingId: string): Promise<void>;
}

export interface IConnectionRepository {
    list(): Promise<Connection[]>;
    create(connection: Connection): Promise<void>;
    delete(requesterId: string, receiverId: string): Promise<void>;
    updateStatus(requesterId: string, receiverId: string, status: 'pending' | 'accepted' | 'declined'): Promise<void>;
}
