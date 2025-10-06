# Contact Form Handler

## Deploy to AWS:

```bash
$ serverless deploy
```

## Test:

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"email":"john.doe@email.com","name":"John Doe","content":"Hey!"}' \
  https://{id}.execute-api.{region}.amazonaws.com/{stage}/email/send
```
