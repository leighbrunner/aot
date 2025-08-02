import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, forgotPassword, forgotPasswordSubmit } from 'aws-amplify/auth';
import { authService } from '../authService';

// Mock Amplify auth
jest.mock('aws-amplify/auth');

describe('AuthService', () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
  const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;
  const mockConfirmSignUp = confirmSignUp as jest.MockedFunction<typeof confirmSignUp>;
  const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
  const mockForgotPassword = forgotPassword as jest.MockedFunction<typeof forgotPassword>;
  const mockForgotPasswordSubmit = forgotPasswordSubmit as jest.MockedFunction<typeof forgotPasswordSubmit>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('successfully signs in a user', async () => {
      const mockSignInResult = {
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      };
      mockSignIn.mockResolvedValue(mockSignInResult);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(mockSignIn).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockSignInResult);
    });

    it('handles sign in errors', async () => {
      const error = new Error('Invalid credentials');
      mockSignIn.mockRejectedValue(error);

      await expect(authService.signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('successfully signs out a user', async () => {
      mockSignOut.mockResolvedValue(undefined);

      await authService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('handles sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(error);

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('signUp', () => {
    it('successfully signs up a new user', async () => {
      const mockSignUpResult = {
        isSignUpComplete: false,
        userId: 'user-123',
        nextStep: {
          signUpStep: 'CONFIRM_SIGN_UP',
          codeDeliveryDetails: {
            deliveryMedium: 'EMAIL' as const,
            destination: 'test@example.com',
          },
        },
      };
      mockSignUp.mockResolvedValue(mockSignUpResult);

      const result = await authService.signUp('test@example.com', 'password123');

      expect(mockSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password123',
        options: {
          userAttributes: {
            email: 'test@example.com',
          },
        },
      });
      expect(result).toEqual(mockSignUpResult);
    });

    it('handles sign up errors', async () => {
      const error = new Error('Username already exists');
      mockSignUp.mockRejectedValue(error);

      await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow('Username already exists');
    });
  });

  describe('confirmSignUp', () => {
    it('successfully confirms sign up', async () => {
      const mockConfirmResult = {
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' },
      };
      mockConfirmSignUp.mockResolvedValue(mockConfirmResult);

      const result = await authService.confirmSignUp('test@example.com', '123456');

      expect(mockConfirmSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
      });
      expect(result).toEqual(mockConfirmResult);
    });

    it('handles confirmation errors', async () => {
      const error = new Error('Invalid confirmation code');
      mockConfirmSignUp.mockRejectedValue(error);

      await expect(authService.confirmSignUp('test@example.com', '000000')).rejects.toThrow('Invalid confirmation code');
    });
  });

  describe('getCurrentUser', () => {
    it('successfully gets current user', async () => {
      const mockUser = {
        username: 'test@example.com',
        userId: 'user-123',
      };
      mockGetCurrentUser.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('returns null when no user is signed in', async () => {
      mockGetCurrentUser.mockRejectedValue(new Error('No current user'));

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('successfully initiates forgot password', async () => {
      const mockForgotResult = {
        isPasswordResetRequested: true,
        nextStep: {
          resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE',
          codeDeliveryDetails: {
            deliveryMedium: 'EMAIL' as const,
            destination: 'test@example.com',
          },
        },
      };
      mockForgotPassword.mockResolvedValue(mockForgotResult);

      const result = await authService.forgotPassword('test@example.com');

      expect(mockForgotPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
      });
      expect(result).toEqual(mockForgotResult);
    });

    it('handles forgot password errors', async () => {
      const error = new Error('User not found');
      mockForgotPassword.mockRejectedValue(error);

      await expect(authService.forgotPassword('test@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('forgotPasswordSubmit', () => {
    it('successfully resets password', async () => {
      mockForgotPasswordSubmit.mockResolvedValue(undefined);

      await authService.forgotPasswordSubmit('test@example.com', '123456', 'newPassword123');

      expect(mockForgotPasswordSubmit).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'newPassword123',
      });
    });

    it('handles password reset errors', async () => {
      const error = new Error('Invalid code');
      mockForgotPasswordSubmit.mockRejectedValue(error);

      await expect(authService.forgotPasswordSubmit('test@example.com', '000000', 'newPassword')).rejects.toThrow('Invalid code');
    });
  });

  describe('signInAnonymously', () => {
    it('successfully signs in anonymously', async () => {
      const mockAnonymousResult = {
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      };
      mockSignIn.mockResolvedValue(mockAnonymousResult);

      const result = await authService.signInAnonymously();

      expect(mockSignIn).toHaveBeenCalledWith({
        username: expect.stringMatching(/^anonymous_[a-f0-9]{32}$/),
        password: expect.any(String),
      });
      expect(result).toEqual(mockAnonymousResult);
    });
  });

  describe('isPasswordValid', () => {
    it('validates correct password format', () => {
      expect(authService.isPasswordValid('Password123!')).toBe(true);
      expect(authService.isPasswordValid('Pass123!')).toBe(true);
      expect(authService.isPasswordValid('LongPassword123!')).toBe(true);
    });

    it('rejects invalid password formats', () => {
      expect(authService.isPasswordValid('short')).toBe(false); // Too short
      expect(authService.isPasswordValid('password')).toBe(false); // No uppercase
      expect(authService.isPasswordValid('PASSWORD')).toBe(false); // No lowercase
      expect(authService.isPasswordValid('Password')).toBe(false); // No number
      expect(authService.isPasswordValid('Password123')).toBe(false); // No special char
    });
  });

  describe('getPasswordErrors', () => {
    it('returns no errors for valid password', () => {
      const errors = authService.getPasswordErrors('Password123!');
      expect(errors).toHaveLength(0);
    });

    it('returns appropriate errors for invalid password', () => {
      const errors = authService.getPasswordErrors('pass');
      expect(errors).toContain('Password must be at least 8 characters long');
      expect(errors).toContain('Password must contain at least one uppercase letter');
      expect(errors).toContain('Password must contain at least one number');
      expect(errors).toContain('Password must contain at least one special character');
    });
  });
});