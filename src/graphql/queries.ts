/* tslint:disable */
/* eslint-disable */
// This file contains GraphQL queries

export const getUser = /* GraphQL */ `
  query GetUser($userId: ID!) {
    getUser(userId: $userId) {
      userId
      email
      username
      preferences
      stats
      isAnonymous
      createdAt
      updatedAt
    }
  }
`;

export const getCurrentUser = /* GraphQL */ `
  query GetCurrentUser {
    getUser(userId: "__CURRENT_USER__") {
      userId
      email
      username
      preferences
      stats
      isAnonymous
      createdAt
      updatedAt
      votes(limit: 100) {
        items {
          voteId
          winnerId
          loserId
          category
          createdAt
        }
      }
    }
  }
`;

export const getUserStats = /* GraphQL */ `
  query GetUserStats($userId: ID!) {
    getUser(userId: $userId) {
      userId
      stats
      votes(limit: 1000) {
        items {
          voteId
          category
          winnerId
          loserId
          createdAt
        }
      }
    }
  }
`;

export const listImages = /* GraphQL */ `
  query ListImages($filter: ModelImageFilterInput, $limit: Int) {
    listImages(filter: $filter, limit: $limit) {
      items {
        imageId
        url
        thumbnailUrl
        characterId
        characterName
        categories
        metadata
        status
        voteCount
        winCount
        rating
      }
    }
  }
`;

export const getImagePair = /* GraphQL */ `
  query GetImagePair($category: String) {
    listImages(
      filter: { 
        status: { eq: "approved" },
        categories: { contains: $category }
      },
      limit: 2
    ) {
      items {
        imageId
        url
        thumbnailUrl
        characterId
        characterName
        categories
        metadata
      }
    }
  }
`;

export const getLeaderboard = /* GraphQL */ `
  query GetLeaderboard($limit: Int, $category: String) {
    listImages(
      filter: { 
        status: { eq: "approved" },
        categories: { contains: $category }
      },
      limit: $limit
    ) {
      items {
        imageId
        url
        thumbnailUrl
        characterName
        categories
        voteCount
        winCount
        rating
      }
    }
  }
`;