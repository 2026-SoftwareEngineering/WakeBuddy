/**
 * 로그인 입력값 검증
 *
 * Firebase 호출 전에 이메일과 비밀번호가 입력되었는지 확인한다.
 */
export function validateLoginInput(email: string, password: string): void {
  if (!email.trim()) {
    throw new Error("이메일을 입력해주세요.");
  }

  if (!password.trim()) {
    throw new Error("비밀번호를 입력해주세요.");
  }
}

/**
 * 회원가입 입력값 검증
 *
 * Firebase 호출 전에 이메일, 비밀번호, 이름이 입력되었는지 확인한다.
 */
export function validateSignUpInput(
  email: string,
  password: string,
  displayName: string,
): void {
  if (!email.trim()) {
    throw new Error("이메일을 입력해주세요.");
  }

  if (!password.trim()) {
    throw new Error("비밀번호를 입력해주세요.");
  }

  if (!displayName.trim()) {
    throw new Error("이름을 입력해주세요.");
  }
}