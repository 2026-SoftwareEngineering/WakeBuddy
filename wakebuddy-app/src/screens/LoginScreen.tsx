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
  goSignUp: () => void;
};

/**
 * 로그인 화면
 *
 * Firebase Authentication 기반 로그인 기능을 수행한다.
 */
export default function LoginScreen({ goMain, goSignUp }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * 로그인 버튼 클릭 시 호출된다.
   */
  const handleLogin = async () => {
    try {
      await AuthService.login(email, password);
      Alert.alert("로그인 성공", "로그인되었습니다.");
    } catch (error) {
      Alert.alert(
        "로그인 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>

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

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
        <Text style={styles.primaryButtonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goSignUp}>
        <Text style={styles.outlineButtonText}>회원가입으로 이동</Text>
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