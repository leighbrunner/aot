/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAnalytics = /* GraphQL */ `mutation CreateAnalytics(
  $condition: ModelAnalyticsConditionInput
  $input: CreateAnalyticsInput!
) {
  createAnalytics(condition: $condition, input: $input) {
    analyticsId
    createdAt
    date
    id
    itemId
    period
    type
    updatedAt
    voteCount
    winCount
    winRate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAnalyticsMutationVariables,
  APITypes.CreateAnalyticsMutation
>;
export const createCategory = /* GraphQL */ `mutation CreateCategory(
  $condition: ModelCategoryConditionInput
  $input: CreateCategoryInput!
) {
  createCategory(condition: $condition, input: $input) {
    categoryId
    createdAt
    createdBy
    displayName
    id
    isActive
    options
    type
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateCategoryMutationVariables,
  APITypes.CreateCategoryMutation
>;
export const createImage = /* GraphQL */ `mutation CreateImage(
  $condition: ModelImageConditionInput
  $input: CreateImageInput!
) {
  createImage(condition: $condition, input: $input) {
    approvedAt
    approvedBy
    categories
    characterId
    characterName
    createdAt
    id
    imageId
    lostVotes {
      nextToken
      __typename
    }
    metadata
    promotionWeight
    rating
    source
    status
    thumbnailUrl
    updatedAt
    url
    voteCount
    winCount
    wonVotes {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateImageMutationVariables,
  APITypes.CreateImageMutation
>;
export const createSession = /* GraphQL */ `mutation CreateSession(
  $condition: ModelSessionConditionInput
  $input: CreateSessionInput!
) {
  createSession(condition: $condition, input: $input) {
    createdAt
    endTime
    id
    owner
    platform
    sessionId
    startTime
    updatedAt
    user {
      createdAt
      email
      id
      isAnonymous
      owner
      preferences
      stats
      updatedAt
      userId
      username
      __typename
    }
    userId
    voteCount
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSessionMutationVariables,
  APITypes.CreateSessionMutation
>;
export const createUser = /* GraphQL */ `mutation CreateUser(
  $condition: ModelUserConditionInput
  $input: CreateUserInput!
) {
  createUser(condition: $condition, input: $input) {
    createdAt
    email
    id
    isAnonymous
    owner
    preferences
    sessions {
      nextToken
      __typename
    }
    stats
    updatedAt
    userId
    username
    votes {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const createVote = /* GraphQL */ `mutation CreateVote(
  $condition: ModelVoteConditionInput
  $input: CreateVoteInput!
) {
  createVote(condition: $condition, input: $input) {
    category
    country
    createdAt
    id
    loserId
    loserImage {
      approvedAt
      approvedBy
      categories
      characterId
      characterName
      createdAt
      id
      imageId
      metadata
      promotionWeight
      rating
      source
      status
      thumbnailUrl
      updatedAt
      url
      voteCount
      winCount
      __typename
    }
    owner
    sessionId
    updatedAt
    user {
      createdAt
      email
      id
      isAnonymous
      owner
      preferences
      stats
      updatedAt
      userId
      username
      __typename
    }
    userId
    voteId
    winnerId
    winnerImage {
      approvedAt
      approvedBy
      categories
      characterId
      characterName
      createdAt
      id
      imageId
      metadata
      promotionWeight
      rating
      source
      status
      thumbnailUrl
      updatedAt
      url
      voteCount
      winCount
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateVoteMutationVariables,
  APITypes.CreateVoteMutation
>;
export const deleteAnalytics = /* GraphQL */ `mutation DeleteAnalytics(
  $condition: ModelAnalyticsConditionInput
  $input: DeleteAnalyticsInput!
) {
  deleteAnalytics(condition: $condition, input: $input) {
    analyticsId
    createdAt
    date
    id
    itemId
    period
    type
    updatedAt
    voteCount
    winCount
    winRate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAnalyticsMutationVariables,
  APITypes.DeleteAnalyticsMutation
>;
export const deleteCategory = /* GraphQL */ `mutation DeleteCategory(
  $condition: ModelCategoryConditionInput
  $input: DeleteCategoryInput!
) {
  deleteCategory(condition: $condition, input: $input) {
    categoryId
    createdAt
    createdBy
    displayName
    id
    isActive
    options
    type
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteCategoryMutationVariables,
  APITypes.DeleteCategoryMutation
>;
export const deleteImage = /* GraphQL */ `mutation DeleteImage(
  $condition: ModelImageConditionInput
  $input: DeleteImageInput!
) {
  deleteImage(condition: $condition, input: $input) {
    approvedAt
    approvedBy
    categories
    characterId
    characterName
    createdAt
    id
    imageId
    lostVotes {
      nextToken
      __typename
    }
    metadata
    promotionWeight
    rating
    source
    status
    thumbnailUrl
    updatedAt
    url
    voteCount
    winCount
    wonVotes {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteImageMutationVariables,
  APITypes.DeleteImageMutation
>;
export const deleteSession = /* GraphQL */ `mutation DeleteSession(
  $condition: ModelSessionConditionInput
  $input: DeleteSessionInput!
) {
  deleteSession(condition: $condition, input: $input) {
    createdAt
    endTime
    id
    owner
    platform
    sessionId
    startTime
    updatedAt
    user {
      createdAt
      email
      id
      isAnonymous
      owner
      preferences
      stats
      updatedAt
      userId
      username
      __typename
    }
    userId
    voteCount
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSessionMutationVariables,
  APITypes.DeleteSessionMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $condition: ModelUserConditionInput
  $input: DeleteUserInput!
) {
  deleteUser(condition: $condition, input: $input) {
    createdAt
    email
    id
    isAnonymous
    owner
    preferences
    sessions {
      nextToken
      __typename
    }
    stats
    updatedAt
    userId
    username
    votes {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const deleteVote = /* GraphQL */ `mutation DeleteVote(
  $condition: ModelVoteConditionInput
  $input: DeleteVoteInput!
) {
  deleteVote(condition: $condition, input: $input) {
    category
    country
    createdAt
    id
    loserId
    loserImage {
      approvedAt
      approvedBy
      categories
      characterId
      characterName
      createdAt
      id
      imageId
      metadata
      promotionWeight
      rating
      source
      status
      thumbnailUrl
      updatedAt
      url
      voteCount
      winCount
      __typename
    }
    owner
    sessionId
    updatedAt
    user {
      createdAt
      email
      id
      isAnonymous
      owner
      preferences
      stats
      updatedAt
      userId
      username
      __typename
    }
    userId
    voteId
    winnerId
    winnerImage {
      approvedAt
      approvedBy
      categories
      characterId
      characterName
      createdAt
      id
      imageId
      metadata
      promotionWeight
      rating
      source
      status
      thumbnailUrl
      updatedAt
      url
      voteCount
      winCount
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteVoteMutationVariables,
  APITypes.DeleteVoteMutation
>;
export const updateAnalytics = /* GraphQL */ `mutation UpdateAnalytics(
  $condition: ModelAnalyticsConditionInput
  $input: UpdateAnalyticsInput!
) {
  updateAnalytics(condition: $condition, input: $input) {
    analyticsId
    createdAt
    date
    id
    itemId
    period
    type
    updatedAt
    voteCount
    winCount
    winRate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAnalyticsMutationVariables,
  APITypes.UpdateAnalyticsMutation
>;
export const updateCategory = /* GraphQL */ `mutation UpdateCategory(
  $condition: ModelCategoryConditionInput
  $input: UpdateCategoryInput!
) {
  updateCategory(condition: $condition, input: $input) {
    categoryId
    createdAt
    createdBy
    displayName
    id
    isActive
    options
    type
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateCategoryMutationVariables,
  APITypes.UpdateCategoryMutation
>;
export const updateImage = /* GraphQL */ `mutation UpdateImage(
  $condition: ModelImageConditionInput
  $input: UpdateImageInput!
) {
  updateImage(condition: $condition, input: $input) {
    approvedAt
    approvedBy
    categories
    characterId
    characterName
    createdAt
    id
    imageId
    lostVotes {
      nextToken
      __typename
    }
    metadata
    promotionWeight
    rating
    source
    status
    thumbnailUrl
    updatedAt
    url
    voteCount
    winCount
    wonVotes {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateImageMutationVariables,
  APITypes.UpdateImageMutation
>;
export const updateSession = /* GraphQL */ `mutation UpdateSession(
  $condition: ModelSessionConditionInput
  $input: UpdateSessionInput!
) {
  updateSession(condition: $condition, input: $input) {
    createdAt
    endTime
    id
    owner
    platform
    sessionId
    startTime
    updatedAt
    user {
      createdAt
      email
      id
      isAnonymous
      owner
      preferences
      stats
      updatedAt
      userId
      username
      __typename
    }
    userId
    voteCount
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSessionMutationVariables,
  APITypes.UpdateSessionMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $condition: ModelUserConditionInput
  $input: UpdateUserInput!
) {
  updateUser(condition: $condition, input: $input) {
    createdAt
    email
    id
    isAnonymous
    owner
    preferences
    sessions {
      nextToken
      __typename
    }
    stats
    updatedAt
    userId
    username
    votes {
      nextToken
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const updateVote = /* GraphQL */ `mutation UpdateVote(
  $condition: ModelVoteConditionInput
  $input: UpdateVoteInput!
) {
  updateVote(condition: $condition, input: $input) {
    category
    country
    createdAt
    id
    loserId
    loserImage {
      approvedAt
      approvedBy
      categories
      characterId
      characterName
      createdAt
      id
      imageId
      metadata
      promotionWeight
      rating
      source
      status
      thumbnailUrl
      updatedAt
      url
      voteCount
      winCount
      __typename
    }
    owner
    sessionId
    updatedAt
    user {
      createdAt
      email
      id
      isAnonymous
      owner
      preferences
      stats
      updatedAt
      userId
      username
      __typename
    }
    userId
    voteId
    winnerId
    winnerImage {
      approvedAt
      approvedBy
      categories
      characterId
      characterName
      createdAt
      id
      imageId
      metadata
      promotionWeight
      rating
      source
      status
      thumbnailUrl
      updatedAt
      url
      voteCount
      winCount
      __typename
    }
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateVoteMutationVariables,
  APITypes.UpdateVoteMutation
>;
