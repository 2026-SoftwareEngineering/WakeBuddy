import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthService } from "../services/AuthService";

type Props = {
  goMain: () => void;
  goLogin: () => void;
};

/**
 * 회원가입 화면
 *
 * Firebase Authentication 계정 생성 후
 * Firestore users 컬렉션에 사용자 프로필을 저장한다.
 */
export default function SignUpScreen({ goMain, goLogin }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * 회원가입 버튼 클릭 시 호출된다.
   */
  const handleSignUp = async () => {
    try {
      await AuthService.signUp(email, password, displayName);
      Alert.alert("회원가입 성공", "계정이 생성되었습니다.");
    } catch (error) {
      Alert.alert(
        "회원가입 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이름"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
        <Text style={styles.primaryButtonText}>회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goLogin}>
        <Text style={styles.outlineButtonText}>로그인으로 이동</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goMain}>
        <Text style={styles.backText}>처음 화면으로</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#222",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  outlineButtonText: {
    color: "#222",
    textAlign: "center",
    fontWeight: "700",
  },
  backText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
});