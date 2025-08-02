/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAnalytics = /* GraphQL */ `subscription OnCreateAnalytics($filter: ModelSubscriptionAnalyticsFilterInput) {
  onCreateAnalytics(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateAnalyticsSubscriptionVariables,
  APITypes.OnCreateAnalyticsSubscription
>;
export const onCreateCategory = /* GraphQL */ `subscription OnCreateCategory($filter: ModelSubscriptionCategoryFilterInput) {
  onCreateCategory(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateCategorySubscriptionVariables,
  APITypes.OnCreateCategorySubscription
>;
export const onCreateImage = /* GraphQL */ `subscription OnCreateImage($filter: ModelSubscriptionImageFilterInput) {
  onCreateImage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnCreateImageSubscriptionVariables,
  APITypes.OnCreateImageSubscription
>;
export const onCreateSession = /* GraphQL */ `subscription OnCreateSession(
  $filter: ModelSubscriptionSessionFilterInput
  $owner: String
) {
  onCreateSession(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateSessionSubscriptionVariables,
  APITypes.OnCreateSessionSubscription
>;
export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onCreateUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onCreateVote = /* GraphQL */ `subscription OnCreateVote(
  $filter: ModelSubscriptionVoteFilterInput
  $owner: String
) {
  onCreateVote(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateVoteSubscriptionVariables,
  APITypes.OnCreateVoteSubscription
>;
export const onDeleteAnalytics = /* GraphQL */ `subscription OnDeleteAnalytics($filter: ModelSubscriptionAnalyticsFilterInput) {
  onDeleteAnalytics(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteAnalyticsSubscriptionVariables,
  APITypes.OnDeleteAnalyticsSubscription
>;
export const onDeleteCategory = /* GraphQL */ `subscription OnDeleteCategory($filter: ModelSubscriptionCategoryFilterInput) {
  onDeleteCategory(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteCategorySubscriptionVariables,
  APITypes.OnDeleteCategorySubscription
>;
export const onDeleteImage = /* GraphQL */ `subscription OnDeleteImage($filter: ModelSubscriptionImageFilterInput) {
  onDeleteImage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteImageSubscriptionVariables,
  APITypes.OnDeleteImageSubscription
>;
export const onDeleteSession = /* GraphQL */ `subscription OnDeleteSession(
  $filter: ModelSubscriptionSessionFilterInput
  $owner: String
) {
  onDeleteSession(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteSessionSubscriptionVariables,
  APITypes.OnDeleteSessionSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onDeleteUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onDeleteVote = /* GraphQL */ `subscription OnDeleteVote(
  $filter: ModelSubscriptionVoteFilterInput
  $owner: String
) {
  onDeleteVote(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteVoteSubscriptionVariables,
  APITypes.OnDeleteVoteSubscription
>;
export const onUpdateAnalytics = /* GraphQL */ `subscription OnUpdateAnalytics($filter: ModelSubscriptionAnalyticsFilterInput) {
  onUpdateAnalytics(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateAnalyticsSubscriptionVariables,
  APITypes.OnUpdateAnalyticsSubscription
>;
export const onUpdateCategory = /* GraphQL */ `subscription OnUpdateCategory($filter: ModelSubscriptionCategoryFilterInput) {
  onUpdateCategory(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateCategorySubscriptionVariables,
  APITypes.OnUpdateCategorySubscription
>;
export const onUpdateImage = /* GraphQL */ `subscription OnUpdateImage($filter: ModelSubscriptionImageFilterInput) {
  onUpdateImage(filter: $filter) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateImageSubscriptionVariables,
  APITypes.OnUpdateImageSubscription
>;
export const onUpdateSession = /* GraphQL */ `subscription OnUpdateSession(
  $filter: ModelSubscriptionSessionFilterInput
  $owner: String
) {
  onUpdateSession(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateSessionSubscriptionVariables,
  APITypes.OnUpdateSessionSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onUpdateUser(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onUpdateVote = /* GraphQL */ `subscription OnUpdateVote(
  $filter: ModelSubscriptionVoteFilterInput
  $owner: String
) {
  onUpdateVote(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateVoteSubscriptionVariables,
  APITypes.OnUpdateVoteSubscription
>;
