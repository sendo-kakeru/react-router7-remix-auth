import * as v from "valibot";

export const EmailSchema = v.pipe(
  v.string(),
  v.nonEmpty("メールアドレスを入力してください。"),
  v.email("メールアドレスの形式が正しくありません。"),
  v.maxLength(40, "メールアドレスは40文字以内で入力してください。"),
);
