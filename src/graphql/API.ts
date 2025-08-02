/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Analytics = {
  __typename: "Analytics",
  analyticsId: string,
  createdAt: string,
  date: string,
  id: string,
  itemId: string,
  period?: AnalyticsPeriod | null,
  type?: AnalyticsType | null,
  updatedAt: string,
  voteCount?: number | null,
  winCount?: number | null,
  winRate?: number | null,
};

export enum AnalyticsPeriod {
  all = "all",
  day = "day",
  month = "month",
  week = "week",
  year = "year",
}


export enum AnalyticsType {
  category = "category",
  character = "character",
  image = "image",
}


export type Category = {
  __typename: "Category",
  categoryId: string,
  createdAt: string,
  createdBy: string,
  displayName: string,
  id: string,
  isActive?: boolean | null,
  options: Array< string | null >,
  type?: CategoryType | null,
  updatedAt: string,
};

export enum CategoryType {
  demographic = "demographic",
  physical = "physical",
  style = "style",
}


export type Image = {
  __typename: "Image",
  approvedAt?: string | null,
  approvedBy?: string | null,
  categories: Array< string | null >,
  characterId: string,
  characterName: string,
  createdAt: string,
  id: string,
  imageId: string,
  lostVotes?: ModelVoteConnection | null,
  metadata?: string | null,
  promotionWeight?: number | null,
  rating?: number | null,
  source?: ImageSource | null,
  status?: ImageStatus | null,
  thumbnailUrl: string,
  updatedAt: string,
  url: string,
  voteCount?: number | null,
  winCount?: number | null,
  wonVotes?: ModelVoteConnection | null,
};

export type ModelVoteConnection = {
  __typename: "ModelVoteConnection",
  items:  Array<Vote | null >,
  nextToken?: string | null,
};

export type Vote = {
  __typename: "Vote",
  category: string,
  country?: string | null,
  createdAt: string,
  id: string,
  loserId: string,
  loserImage?: Image | null,
  owner?: string | null,
  sessionId: string,
  updatedAt: string,
  user?: User | null,
  userId: string,
  voteId: string,
  winnerId: string,
  winnerImage?: Image | null,
};

export type User = {
  __typename: "User",
  createdAt: string,
  email?: string | null,
  id: string,
  isAnonymous?: boolean | null,
  owner?: string | null,
  preferences?: string | null,
  sessions?: ModelSessionConnection | null,
  stats?: string | null,
  updatedAt: string,
  userId: string,
  username?: string | null,
  votes?: ModelVoteConnection | null,
};

export type ModelSessionConnection = {
  __typename: "ModelSessionConnection",
  items:  Array<Session | null >,
  nextToken?: string | null,
};

export type Session = {
  __typename: "Session",
  createdAt: string,
  endTime?: string | null,
  id: string,
  owner?: string | null,
  platform?: SessionPlatform | null,
  sessionId: string,
  startTime: string,
  updatedAt: string,
  user?: User | null,
  userId: string,
  voteCount?: number | null,
};

export enum SessionPlatform {
  android = "android",
  ios = "ios",
  web = "web",
}


export enum ImageSource {
  ai = "ai",
  user = "user",
}


export enum ImageStatus {
  approved = "approved",
  pending = "pending",
  rejected = "rejected",
}


export type ModelAnalyticsFilterInput = {
  analyticsId?: ModelIDInput | null,
  and?: Array< ModelAnalyticsFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  date?: ModelStringInput | null,
  id?: ModelIDInput | null,
  itemId?: ModelStringInput | null,
  not?: ModelAnalyticsFilterInput | null,
  or?: Array< ModelAnalyticsFilterInput | null > | null,
  period?: ModelAnalyticsPeriodInput | null,
  type?: ModelAnalyticsTypeInput | null,
  updatedAt?: ModelStringInput | null,
  voteCount?: ModelIntInput | null,
  winCount?: ModelIntInput | null,
  winRate?: ModelFloatInput | null,
};

export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelAnalyticsPeriodInput = {
  eq?: AnalyticsPeriod | null,
  ne?: AnalyticsPeriod | null,
};

export type ModelAnalyticsTypeInput = {
  eq?: AnalyticsType | null,
  ne?: AnalyticsType | null,
};

export type ModelIntInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelFloatInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelAnalyticsConnection = {
  __typename: "ModelAnalyticsConnection",
  items:  Array<Analytics | null >,
  nextToken?: string | null,
};

export type ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyConditionInput = {
  beginsWith?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null,
  between?: Array< ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null > | null,
  eq?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null,
  ge?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null,
  gt?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null,
  le?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null,
  lt?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput | null,
};

export type ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyInput = {
  date?: string | null,
  itemId?: string | null,
  period?: AnalyticsPeriod | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelCategoryFilterInput = {
  and?: Array< ModelCategoryFilterInput | null > | null,
  categoryId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  createdBy?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isActive?: ModelBooleanInput | null,
  not?: ModelCategoryFilterInput | null,
  options?: ModelStringInput | null,
  or?: Array< ModelCategoryFilterInput | null > | null,
  type?: ModelCategoryTypeInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelCategoryTypeInput = {
  eq?: CategoryType | null,
  ne?: CategoryType | null,
};

export type ModelCategoryConnection = {
  __typename: "ModelCategoryConnection",
  items:  Array<Category | null >,
  nextToken?: string | null,
};

export type ModelImageFilterInput = {
  and?: Array< ModelImageFilterInput | null > | null,
  approvedAt?: ModelStringInput | null,
  approvedBy?: ModelStringInput | null,
  categories?: ModelStringInput | null,
  characterId?: ModelStringInput | null,
  characterName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  imageId?: ModelIDInput | null,
  metadata?: ModelStringInput | null,
  not?: ModelImageFilterInput | null,
  or?: Array< ModelImageFilterInput | null > | null,
  promotionWeight?: ModelIntInput | null,
  rating?: ModelFloatInput | null,
  source?: ModelImageSourceInput | null,
  status?: ModelImageStatusInput | null,
  thumbnailUrl?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  url?: ModelStringInput | null,
  voteCount?: ModelIntInput | null,
  winCount?: ModelIntInput | null,
};

export type ModelImageSourceInput = {
  eq?: ImageSource | null,
  ne?: ImageSource | null,
};

export type ModelImageStatusInput = {
  eq?: ImageStatus | null,
  ne?: ImageStatus | null,
};

export type ModelIDKeyConditionInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
};

export type ModelImageConnection = {
  __typename: "ModelImageConnection",
  items:  Array<Image | null >,
  nextToken?: string | null,
};

export type ModelFloatKeyConditionInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
};

export type ModelSessionFilterInput = {
  and?: Array< ModelSessionFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  endTime?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelSessionFilterInput | null,
  or?: Array< ModelSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  platform?: ModelSessionPlatformInput | null,
  sessionId?: ModelIDInput | null,
  startTime?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  voteCount?: ModelIntInput | null,
};

export type ModelSessionPlatformInput = {
  eq?: SessionPlatform | null,
  ne?: SessionPlatform | null,
};

export type ModelUserFilterInput = {
  and?: Array< ModelUserFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  id?: ModelIDInput | null,
  isAnonymous?: ModelBooleanInput | null,
  not?: ModelUserFilterInput | null,
  or?: Array< ModelUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
  preferences?: ModelStringInput | null,
  stats?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  username?: ModelStringInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelVoteFilterInput = {
  and?: Array< ModelVoteFilterInput | null > | null,
  category?: ModelStringInput | null,
  country?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  loserId?: ModelStringInput | null,
  not?: ModelVoteFilterInput | null,
  or?: Array< ModelVoteFilterInput | null > | null,
  owner?: ModelStringInput | null,
  sessionId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  voteId?: ModelIDInput | null,
  winnerId?: ModelStringInput | null,
};

export type ModelAnalyticsConditionInput = {
  analyticsId?: ModelIDInput | null,
  and?: Array< ModelAnalyticsConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  date?: ModelStringInput | null,
  itemId?: ModelStringInput | null,
  not?: ModelAnalyticsConditionInput | null,
  or?: Array< ModelAnalyticsConditionInput | null > | null,
  period?: ModelAnalyticsPeriodInput | null,
  type?: ModelAnalyticsTypeInput | null,
  updatedAt?: ModelStringInput | null,
  voteCount?: ModelIntInput | null,
  winCount?: ModelIntInput | null,
  winRate?: ModelFloatInput | null,
};

export type CreateAnalyticsInput = {
  analyticsId: string,
  date: string,
  id?: string | null,
  itemId: string,
  period?: AnalyticsPeriod | null,
  type?: AnalyticsType | null,
  voteCount?: number | null,
  winCount?: number | null,
  winRate?: number | null,
};

export type ModelCategoryConditionInput = {
  and?: Array< ModelCategoryConditionInput | null > | null,
  categoryId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  createdBy?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  isActive?: ModelBooleanInput | null,
  not?: ModelCategoryConditionInput | null,
  options?: ModelStringInput | null,
  or?: Array< ModelCategoryConditionInput | null > | null,
  type?: ModelCategoryTypeInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateCategoryInput = {
  categoryId: string,
  createdBy: string,
  displayName: string,
  id?: string | null,
  isActive?: boolean | null,
  options: Array< string | null >,
  type?: CategoryType | null,
};

export type ModelImageConditionInput = {
  and?: Array< ModelImageConditionInput | null > | null,
  approvedAt?: ModelStringInput | null,
  approvedBy?: ModelStringInput | null,
  categories?: ModelStringInput | null,
  characterId?: ModelStringInput | null,
  characterName?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  imageId?: ModelIDInput | null,
  metadata?: ModelStringInput | null,
  not?: ModelImageConditionInput | null,
  or?: Array< ModelImageConditionInput | null > | null,
  promotionWeight?: ModelIntInput | null,
  rating?: ModelFloatInput | null,
  source?: ModelImageSourceInput | null,
  status?: ModelImageStatusInput | null,
  thumbnailUrl?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  url?: ModelStringInput | null,
  voteCount?: ModelIntInput | null,
  winCount?: ModelIntInput | null,
};

export type CreateImageInput = {
  approvedAt?: string | null,
  approvedBy?: string | null,
  categories: Array< string | null >,
  characterId: string,
  characterName: string,
  id?: string | null,
  imageId: string,
  metadata?: string | null,
  promotionWeight?: number | null,
  rating?: number | null,
  source?: ImageSource | null,
  status?: ImageStatus | null,
  thumbnailUrl: string,
  url: string,
  voteCount?: number | null,
  winCount?: number | null,
};

export type ModelSessionConditionInput = {
  and?: Array< ModelSessionConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  endTime?: ModelStringInput | null,
  not?: ModelSessionConditionInput | null,
  or?: Array< ModelSessionConditionInput | null > | null,
  owner?: ModelStringInput | null,
  platform?: ModelSessionPlatformInput | null,
  sessionId?: ModelIDInput | null,
  startTime?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  voteCount?: ModelIntInput | null,
};

export type CreateSessionInput = {
  endTime?: string | null,
  id?: string | null,
  platform?: SessionPlatform | null,
  sessionId: string,
  startTime: string,
  userId: string,
  voteCount?: number | null,
};

export type ModelUserConditionInput = {
  and?: Array< ModelUserConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  email?: ModelStringInput | null,
  isAnonymous?: ModelBooleanInput | null,
  not?: ModelUserConditionInput | null,
  or?: Array< ModelUserConditionInput | null > | null,
  owner?: ModelStringInput | null,
  preferences?: ModelStringInput | null,
  stats?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  username?: ModelStringInput | null,
};

export type CreateUserInput = {
  email?: string | null,
  id?: string | null,
  isAnonymous?: boolean | null,
  preferences?: string | null,
  stats?: string | null,
  userId: string,
  username?: string | null,
};

export type ModelVoteConditionInput = {
  and?: Array< ModelVoteConditionInput | null > | null,
  category?: ModelStringInput | null,
  country?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  loserId?: ModelStringInput | null,
  not?: ModelVoteConditionInput | null,
  or?: Array< ModelVoteConditionInput | null > | null,
  owner?: ModelStringInput | null,
  sessionId?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  userId?: ModelStringInput | null,
  voteId?: ModelIDInput | null,
  winnerId?: ModelStringInput | null,
};

export type CreateVoteInput = {
  category: string,
  country?: string | null,
  id?: string | null,
  loserId: string,
  sessionId: string,
  userId: string,
  voteId: string,
  winnerId: string,
};

export type DeleteAnalyticsInput = {
  id: string,
};

export type DeleteCategoryInput = {
  id: string,
};

export type DeleteImageInput = {
  id: string,
};

export type DeleteSessionInput = {
  id: string,
};

export type DeleteUserInput = {
  id: string,
};

export type DeleteVoteInput = {
  id: string,
};

export type UpdateAnalyticsInput = {
  analyticsId?: string | null,
  date?: string | null,
  id: string,
  itemId?: string | null,
  period?: AnalyticsPeriod | null,
  type?: AnalyticsType | null,
  voteCount?: number | null,
  winCount?: number | null,
  winRate?: number | null,
};

export type UpdateCategoryInput = {
  categoryId?: string | null,
  createdBy?: string | null,
  displayName?: string | null,
  id: string,
  isActive?: boolean | null,
  options?: Array< string | null > | null,
  type?: CategoryType | null,
};

export type UpdateImageInput = {
  approvedAt?: string | null,
  approvedBy?: string | null,
  categories?: Array< string | null > | null,
  characterId?: string | null,
  characterName?: string | null,
  id: string,
  imageId?: string | null,
  metadata?: string | null,
  promotionWeight?: number | null,
  rating?: number | null,
  source?: ImageSource | null,
  status?: ImageStatus | null,
  thumbnailUrl?: string | null,
  url?: string | null,
  voteCount?: number | null,
  winCount?: number | null,
};

export type UpdateSessionInput = {
  endTime?: string | null,
  id: string,
  platform?: SessionPlatform | null,
  sessionId?: string | null,
  startTime?: string | null,
  userId?: string | null,
  voteCount?: number | null,
};

export type UpdateUserInput = {
  email?: string | null,
  id: string,
  isAnonymous?: boolean | null,
  preferences?: string | null,
  stats?: string | null,
  userId?: string | null,
  username?: string | null,
};

export type UpdateVoteInput = {
  category?: string | null,
  country?: string | null,
  id: string,
  loserId?: string | null,
  sessionId?: string | null,
  userId?: string | null,
  voteId?: string | null,
  winnerId?: string | null,
};

export type ModelSubscriptionAnalyticsFilterInput = {
  analyticsId?: ModelSubscriptionIDInput | null,
  and?: Array< ModelSubscriptionAnalyticsFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  date?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  itemId?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionAnalyticsFilterInput | null > | null,
  period?: ModelSubscriptionStringInput | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  voteCount?: ModelSubscriptionIntInput | null,
  winCount?: ModelSubscriptionIntInput | null,
  winRate?: ModelSubscriptionFloatInput | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIntInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionFloatInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  in?: Array< number | null > | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionCategoryFilterInput = {
  and?: Array< ModelSubscriptionCategoryFilterInput | null > | null,
  categoryId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  createdBy?: ModelSubscriptionStringInput | null,
  displayName?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isActive?: ModelSubscriptionBooleanInput | null,
  options?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionCategoryFilterInput | null > | null,
  type?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionImageFilterInput = {
  and?: Array< ModelSubscriptionImageFilterInput | null > | null,
  approvedAt?: ModelSubscriptionStringInput | null,
  approvedBy?: ModelSubscriptionStringInput | null,
  categories?: ModelSubscriptionStringInput | null,
  characterId?: ModelSubscriptionStringInput | null,
  characterName?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  imageId?: ModelSubscriptionIDInput | null,
  metadata?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionImageFilterInput | null > | null,
  promotionWeight?: ModelSubscriptionIntInput | null,
  rating?: ModelSubscriptionFloatInput | null,
  source?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  thumbnailUrl?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  url?: ModelSubscriptionStringInput | null,
  voteCount?: ModelSubscriptionIntInput | null,
  winCount?: ModelSubscriptionIntInput | null,
};

export type ModelSubscriptionSessionFilterInput = {
  and?: Array< ModelSubscriptionSessionFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  endTime?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  platform?: ModelSubscriptionStringInput | null,
  sessionId?: ModelSubscriptionIDInput | null,
  startTime?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
  voteCount?: ModelSubscriptionIntInput | null,
};

export type ModelSubscriptionUserFilterInput = {
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  isAnonymous?: ModelSubscriptionBooleanInput | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  owner?: ModelStringInput | null,
  preferences?: ModelSubscriptionStringInput | null,
  stats?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionVoteFilterInput = {
  and?: Array< ModelSubscriptionVoteFilterInput | null > | null,
  category?: ModelSubscriptionStringInput | null,
  country?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  loserId?: ModelSubscriptionStringInput | null,
  or?: Array< ModelSubscriptionVoteFilterInput | null > | null,
  owner?: ModelStringInput | null,
  sessionId?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionStringInput | null,
  voteId?: ModelSubscriptionIDInput | null,
  winnerId?: ModelSubscriptionStringInput | null,
};

export type GetAnalyticsQueryVariables = {
  id: string,
};

export type GetAnalyticsQuery = {
  getAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type GetCategoryQueryVariables = {
  id: string,
};

export type GetCategoryQuery = {
  getCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type GetImageQueryVariables = {
  id: string,
};

export type GetImageQuery = {
  getImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type GetSessionQueryVariables = {
  id: string,
};

export type GetSessionQuery = {
  getSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type GetVoteQueryVariables = {
  id: string,
};

export type GetVoteQuery = {
  getVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};

export type ListAnalyticsQueryVariables = {
  filter?: ModelAnalyticsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListAnalyticsQuery = {
  listAnalytics?:  {
    __typename: "ModelAnalyticsConnection",
    items:  Array< {
      __typename: "Analytics",
      analyticsId: string,
      createdAt: string,
      date: string,
      id: string,
      itemId: string,
      period?: AnalyticsPeriod | null,
      type?: AnalyticsType | null,
      updatedAt: string,
      voteCount?: number | null,
      winCount?: number | null,
      winRate?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListAnalyticsByTypeAndPeriodAndDateAndItemIdQueryVariables = {
  filter?: ModelAnalyticsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  periodDateItemId?: ModelAnalyticsAnalyticsByTypeAndPeriodAndDateAndItemIdCompositeKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  type: AnalyticsType,
};

export type ListAnalyticsByTypeAndPeriodAndDateAndItemIdQuery = {
  listAnalyticsByTypeAndPeriodAndDateAndItemId?:  {
    __typename: "ModelAnalyticsConnection",
    items:  Array< {
      __typename: "Analytics",
      analyticsId: string,
      createdAt: string,
      date: string,
      id: string,
      itemId: string,
      period?: AnalyticsPeriod | null,
      type?: AnalyticsType | null,
      updatedAt: string,
      voteCount?: number | null,
      winCount?: number | null,
      winRate?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListCategoriesQueryVariables = {
  filter?: ModelCategoryFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListCategoriesQuery = {
  listCategories?:  {
    __typename: "ModelCategoryConnection",
    items:  Array< {
      __typename: "Category",
      categoryId: string,
      createdAt: string,
      createdBy: string,
      displayName: string,
      id: string,
      isActive?: boolean | null,
      options: Array< string | null >,
      type?: CategoryType | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListImageByCharacterIdAndImageIdQueryVariables = {
  characterId: string,
  filter?: ModelImageFilterInput | null,
  imageId?: ModelIDKeyConditionInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListImageByCharacterIdAndImageIdQuery = {
  listImageByCharacterIdAndImageId?:  {
    __typename: "ModelImageConnection",
    items:  Array< {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListImageByStatusAndRatingQueryVariables = {
  filter?: ModelImageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  rating?: ModelFloatKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  status: ImageStatus,
};

export type ListImageByStatusAndRatingQuery = {
  listImageByStatusAndRating?:  {
    __typename: "ModelImageConnection",
    items:  Array< {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListImagesQueryVariables = {
  filter?: ModelImageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListImagesQuery = {
  listImages?:  {
    __typename: "ModelImageConnection",
    items:  Array< {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListSessionsQueryVariables = {
  filter?: ModelSessionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSessionsQuery = {
  listSessions?:  {
    __typename: "ModelSessionConnection",
    items:  Array< {
      __typename: "Session",
      createdAt: string,
      endTime?: string | null,
      id: string,
      owner?: string | null,
      platform?: SessionPlatform | null,
      sessionId: string,
      startTime: string,
      updatedAt: string,
      userId: string,
      voteCount?: number | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUserByEmailAndUserIdQueryVariables = {
  email: string,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
  userId?: ModelIDKeyConditionInput | null,
};

export type ListUserByEmailAndUserIdQuery = {
  listUserByEmailAndUserId?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListVoteByUserIdAndVoteIdQueryVariables = {
  filter?: ModelVoteFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
  userId: string,
  voteId?: ModelIDKeyConditionInput | null,
};

export type ListVoteByUserIdAndVoteIdQuery = {
  listVoteByUserIdAndVoteId?:  {
    __typename: "ModelVoteConnection",
    items:  Array< {
      __typename: "Vote",
      category: string,
      country?: string | null,
      createdAt: string,
      id: string,
      loserId: string,
      owner?: string | null,
      sessionId: string,
      updatedAt: string,
      userId: string,
      voteId: string,
      winnerId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListVoteByWinnerIdAndVoteIdQueryVariables = {
  filter?: ModelVoteFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
  voteId?: ModelIDKeyConditionInput | null,
  winnerId: string,
};

export type ListVoteByWinnerIdAndVoteIdQuery = {
  listVoteByWinnerIdAndVoteId?:  {
    __typename: "ModelVoteConnection",
    items:  Array< {
      __typename: "Vote",
      category: string,
      country?: string | null,
      createdAt: string,
      id: string,
      loserId: string,
      owner?: string | null,
      sessionId: string,
      updatedAt: string,
      userId: string,
      voteId: string,
      winnerId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListVotesQueryVariables = {
  filter?: ModelVoteFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListVotesQuery = {
  listVotes?:  {
    __typename: "ModelVoteConnection",
    items:  Array< {
      __typename: "Vote",
      category: string,
      country?: string | null,
      createdAt: string,
      id: string,
      loserId: string,
      owner?: string | null,
      sessionId: string,
      updatedAt: string,
      userId: string,
      voteId: string,
      winnerId: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateAnalyticsMutationVariables = {
  condition?: ModelAnalyticsConditionInput | null,
  input: CreateAnalyticsInput,
};

export type CreateAnalyticsMutation = {
  createAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type CreateCategoryMutationVariables = {
  condition?: ModelCategoryConditionInput | null,
  input: CreateCategoryInput,
};

export type CreateCategoryMutation = {
  createCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type CreateImageMutationVariables = {
  condition?: ModelImageConditionInput | null,
  input: CreateImageInput,
};

export type CreateImageMutation = {
  createImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type CreateSessionMutationVariables = {
  condition?: ModelSessionConditionInput | null,
  input: CreateSessionInput,
};

export type CreateSessionMutation = {
  createSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type CreateUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: CreateUserInput,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type CreateVoteMutationVariables = {
  condition?: ModelVoteConditionInput | null,
  input: CreateVoteInput,
};

export type CreateVoteMutation = {
  createVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};

export type DeleteAnalyticsMutationVariables = {
  condition?: ModelAnalyticsConditionInput | null,
  input: DeleteAnalyticsInput,
};

export type DeleteAnalyticsMutation = {
  deleteAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type DeleteCategoryMutationVariables = {
  condition?: ModelCategoryConditionInput | null,
  input: DeleteCategoryInput,
};

export type DeleteCategoryMutation = {
  deleteCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type DeleteImageMutationVariables = {
  condition?: ModelImageConditionInput | null,
  input: DeleteImageInput,
};

export type DeleteImageMutation = {
  deleteImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type DeleteSessionMutationVariables = {
  condition?: ModelSessionConditionInput | null,
  input: DeleteSessionInput,
};

export type DeleteSessionMutation = {
  deleteSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type DeleteUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: DeleteUserInput,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type DeleteVoteMutationVariables = {
  condition?: ModelVoteConditionInput | null,
  input: DeleteVoteInput,
};

export type DeleteVoteMutation = {
  deleteVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};

export type UpdateAnalyticsMutationVariables = {
  condition?: ModelAnalyticsConditionInput | null,
  input: UpdateAnalyticsInput,
};

export type UpdateAnalyticsMutation = {
  updateAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type UpdateCategoryMutationVariables = {
  condition?: ModelCategoryConditionInput | null,
  input: UpdateCategoryInput,
};

export type UpdateCategoryMutation = {
  updateCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type UpdateImageMutationVariables = {
  condition?: ModelImageConditionInput | null,
  input: UpdateImageInput,
};

export type UpdateImageMutation = {
  updateImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type UpdateSessionMutationVariables = {
  condition?: ModelSessionConditionInput | null,
  input: UpdateSessionInput,
};

export type UpdateSessionMutation = {
  updateSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type UpdateUserMutationVariables = {
  condition?: ModelUserConditionInput | null,
  input: UpdateUserInput,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type UpdateVoteMutationVariables = {
  condition?: ModelVoteConditionInput | null,
  input: UpdateVoteInput,
};

export type UpdateVoteMutation = {
  updateVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};

export type OnCreateAnalyticsSubscriptionVariables = {
  filter?: ModelSubscriptionAnalyticsFilterInput | null,
};

export type OnCreateAnalyticsSubscription = {
  onCreateAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type OnCreateCategorySubscriptionVariables = {
  filter?: ModelSubscriptionCategoryFilterInput | null,
};

export type OnCreateCategorySubscription = {
  onCreateCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type OnCreateImageSubscriptionVariables = {
  filter?: ModelSubscriptionImageFilterInput | null,
};

export type OnCreateImageSubscription = {
  onCreateImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnCreateSessionSubscriptionVariables = {
  filter?: ModelSubscriptionSessionFilterInput | null,
  owner?: string | null,
};

export type OnCreateSessionSubscription = {
  onCreateSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnCreateVoteSubscriptionVariables = {
  filter?: ModelSubscriptionVoteFilterInput | null,
  owner?: string | null,
};

export type OnCreateVoteSubscription = {
  onCreateVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};

export type OnDeleteAnalyticsSubscriptionVariables = {
  filter?: ModelSubscriptionAnalyticsFilterInput | null,
};

export type OnDeleteAnalyticsSubscription = {
  onDeleteAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type OnDeleteCategorySubscriptionVariables = {
  filter?: ModelSubscriptionCategoryFilterInput | null,
};

export type OnDeleteCategorySubscription = {
  onDeleteCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteImageSubscriptionVariables = {
  filter?: ModelSubscriptionImageFilterInput | null,
};

export type OnDeleteImageSubscription = {
  onDeleteImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnDeleteSessionSubscriptionVariables = {
  filter?: ModelSubscriptionSessionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteSessionSubscription = {
  onDeleteSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnDeleteVoteSubscriptionVariables = {
  filter?: ModelSubscriptionVoteFilterInput | null,
  owner?: string | null,
};

export type OnDeleteVoteSubscription = {
  onDeleteVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};

export type OnUpdateAnalyticsSubscriptionVariables = {
  filter?: ModelSubscriptionAnalyticsFilterInput | null,
};

export type OnUpdateAnalyticsSubscription = {
  onUpdateAnalytics?:  {
    __typename: "Analytics",
    analyticsId: string,
    createdAt: string,
    date: string,
    id: string,
    itemId: string,
    period?: AnalyticsPeriod | null,
    type?: AnalyticsType | null,
    updatedAt: string,
    voteCount?: number | null,
    winCount?: number | null,
    winRate?: number | null,
  } | null,
};

export type OnUpdateCategorySubscriptionVariables = {
  filter?: ModelSubscriptionCategoryFilterInput | null,
};

export type OnUpdateCategorySubscription = {
  onUpdateCategory?:  {
    __typename: "Category",
    categoryId: string,
    createdAt: string,
    createdBy: string,
    displayName: string,
    id: string,
    isActive?: boolean | null,
    options: Array< string | null >,
    type?: CategoryType | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateImageSubscriptionVariables = {
  filter?: ModelSubscriptionImageFilterInput | null,
};

export type OnUpdateImageSubscription = {
  onUpdateImage?:  {
    __typename: "Image",
    approvedAt?: string | null,
    approvedBy?: string | null,
    categories: Array< string | null >,
    characterId: string,
    characterName: string,
    createdAt: string,
    id: string,
    imageId: string,
    lostVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
    metadata?: string | null,
    promotionWeight?: number | null,
    rating?: number | null,
    source?: ImageSource | null,
    status?: ImageStatus | null,
    thumbnailUrl: string,
    updatedAt: string,
    url: string,
    voteCount?: number | null,
    winCount?: number | null,
    wonVotes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnUpdateSessionSubscriptionVariables = {
  filter?: ModelSubscriptionSessionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateSessionSubscription = {
  onUpdateSession?:  {
    __typename: "Session",
    createdAt: string,
    endTime?: string | null,
    id: string,
    owner?: string | null,
    platform?: SessionPlatform | null,
    sessionId: string,
    startTime: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteCount?: number | null,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    createdAt: string,
    email?: string | null,
    id: string,
    isAnonymous?: boolean | null,
    owner?: string | null,
    preferences?: string | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    stats?: string | null,
    updatedAt: string,
    userId: string,
    username?: string | null,
    votes?:  {
      __typename: "ModelVoteConnection",
      nextToken?: string | null,
    } | null,
  } | null,
};

export type OnUpdateVoteSubscriptionVariables = {
  filter?: ModelSubscriptionVoteFilterInput | null,
  owner?: string | null,
};

export type OnUpdateVoteSubscription = {
  onUpdateVote?:  {
    __typename: "Vote",
    category: string,
    country?: string | null,
    createdAt: string,
    id: string,
    loserId: string,
    loserImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
    owner?: string | null,
    sessionId: string,
    updatedAt: string,
    user?:  {
      __typename: "User",
      createdAt: string,
      email?: string | null,
      id: string,
      isAnonymous?: boolean | null,
      owner?: string | null,
      preferences?: string | null,
      stats?: string | null,
      updatedAt: string,
      userId: string,
      username?: string | null,
    } | null,
    userId: string,
    voteId: string,
    winnerId: string,
    winnerImage?:  {
      __typename: "Image",
      approvedAt?: string | null,
      approvedBy?: string | null,
      categories: Array< string | null >,
      characterId: string,
      characterName: string,
      createdAt: string,
      id: string,
      imageId: string,
      metadata?: string | null,
      promotionWeight?: number | null,
      rating?: number | null,
      source?: ImageSource | null,
      status?: ImageStatus | null,
      thumbnailUrl: string,
      updatedAt: string,
      url: string,
      voteCount?: number | null,
      winCount?: number | null,
    } | null,
  } | null,
};
