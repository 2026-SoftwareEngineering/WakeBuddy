import {
  validateLoginInput,
  validateSignUpInput,
} from "../src/utils/AuthValidationUtils";

describe("AuthValidationUtils", () => {
  describe("validateLoginInput", () => {
    test("이메일과 비밀번호가 모두 입력되면 오류가 발생하지 않는다.", () => {
      expect(() => {
        validateLoginInput("test@example.com", "123456");
      }).not.toThrow();
    });

    test("이메일이 비어 있으면 오류가 발생한다.", () => {
      expect(() => {
        validateLoginInput("", "123456");
      }).toThrow("이메일을 입력해주세요.");
    });

    test("비밀번호가 비어 있으면 오류가 발생한다.", () => {
      expect(() => {
        validateLoginInput("test@example.com", "");
      }).toThrow("비밀번호를 입력해주세요.");
    });

    test("공백만 입력된 이메일은 비어 있는 값으로 처리한다.", () => {
      expect(() => {
        validateLoginInput("   ", "123456");
      }).toThrow("이메일을 입력해주세요.");
    });

    test("공백만 입력된 비밀번호는 비어 있는 값으로 처리한다.", () => {
      expect(() => {
        validateLoginInput("test@example.com", "   ");
      }).toThrow("비밀번호를 입력해주세요.");
    });
  });

  describe("validateSignUpInput", () => {
    test("이메일, 비밀번호, 이름이 모두 입력되면 오류가 발생하지 않는다.", () => {
      expect(() => {
        validateSignUpInput("test@example.com", "123456", "홍길동");
      }).not.toThrow();
    });

    test("이메일이 비어 있으면 오류가 발생한다.", () => {
      expect(() => {
        validateSignUpInput("", "123456", "홍길동");
      }).toThrow("이메일을 입력해주세요.");
    });

    test("비밀번호가 비어 있으면 오류가 발생한다.", () => {
      expect(() => {
        validateSignUpInput("test@example.com", "", "홍길동");
      }).toThrow("비밀번호를 입력해주세요.");
    });

    test("이름이 비어 있으면 오류가 발생한다.", () => {
      expect(() => {
        validateSignUpInput("test@example.com", "123456", "");
      }).toThrow("이름을 입력해주세요.");
    });

    test("공백만 입력된 이름은 비어 있는 값으로 처리한다.", () => {
      expect(() => {
        validateSignUpInput("test@example.com", "123456", "   ");
      }).toThrow("이름을 입력해주세요.");
    });
  });
});