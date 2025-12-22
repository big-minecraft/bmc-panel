# Build stage for Node.js application
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm ci
COPY . .
RUN npm run build

# Tools installation stage using Alpine
FROM alpine:3.19 AS tools

# Set version constants
ENV HELM_VERSION="v3.16.2" \
    HELMFILE_VERSION="v0.158.0" \
    HELM_DIFF_VERSION="v3.9.11" \
    KUBECTL_VERSION="v1.29.2"

RUN apk add --no-cache curl tar jq
WORKDIR /tools

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x kubectl

# Install helm
RUN curl -L "https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz" | tar xz && \
    mv linux-amd64/helm ./

# Install helmfile
RUN curl -L "https://github.com/helmfile/helmfile/releases/download/${HELMFILE_VERSION}/helmfile_${HELMFILE_VERSION#v}_linux_amd64.tar.gz" | \
    tar xz && \
    chmod +x helmfile

# Install helm-dif
RUN mkdir -p /tools/helm-plugins/diff
RUN curl -L "https://github.com/databus23/helm-diff/releases/download/${HELM_DIFF_VERSION}/helm-diff-linux-amd64.tgz" | \
    tar xz -C /tools/helm-plugins/diff

# Final runtime stage
FROM node:18-slim

WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy application files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/node_modules ./server/node_modules

# Copy binaries and plugins from tools stage
COPY --from=tools /tools/kubectl /usr/local/bin/
COPY --from=tools /tools/helm /usr/local/bin/
COPY --from=tools /tools/helmfile /usr/local/bin/
COPY --from=tools /usr/bin/jq /usr/local/bin/
COPY --from=tools /tools/helm-plugins/diff /root/.local/share/helm/plugins/diff

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server/src/app.js"]